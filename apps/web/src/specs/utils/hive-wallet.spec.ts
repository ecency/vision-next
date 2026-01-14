import { HiveWallet } from "../../utils/hive-wallet";
import { Account, DynamicProps } from "@/entities";

describe("HiveWallet", () => {
  const mockDynamicProps: DynamicProps = {
    hivePerMVests: 500, // Typical value
    base: 0.5,
    quote: 1.0,
    fundRecentClaims: 1,
    fundRewardBalance: 1,
    hbdPrintRate: 1,
    hbdInterestRate: 1,
    headBlock: 1,
    totalVestingFund: 1,
    totalVestingShares: 1,
    virtualSupply: 1,
    vestingRewardPercent: 1,
    accountCreationFee: "3.000 HIVE"
  };

  const mockAccount: Account = {
    name: "testuser",
    balance: "100.000 HIVE",
    savings_balance: "0.000 HIVE",
    hbd_balance: "50.000 HBD",
    savings_hbd_balance: "0.000 HBD",
    savings_hbd_seconds: "0",
    reward_hive_balance: "0.000 HIVE",
    reward_hbd_balance: "0.000 HBD",
    reward_vesting_hive: "0.000000 VESTS",
    vesting_shares: "1000.000000 VESTS",
    delegated_vesting_shares: "0.000000 VESTS",
    received_vesting_shares: "0.000000 VESTS",
    vesting_withdraw_rate: "0.000000 VESTS",
    next_vesting_withdrawal: "1969-12-31T23:59:59",
    to_withdraw: "0",
    withdrawn: "0",
    savings_hbd_last_interest_payment: "1969-12-31T23:59:59",
    savings_hbd_withdraw_requests: 0
  } as any;

  describe("power down calculations", () => {
    it("calculates toWithdraw correctly when powering down", () => {
      const poweringDownAccount = {
        ...mockAccount,
        next_vesting_withdrawal: "2024-01-15T00:00:00",
        to_withdraw: "1000000000", // 1000 VESTS in satoshis (1000 * 1e6)
        withdrawn: "0",
        vesting_withdraw_rate: "76.923077 VESTS"
      };

      const wallet = new HiveWallet(poweringDownAccount, mockDynamicProps);

      // toWithdraw should be: (1000000000 / 1e6) = 1000 VESTS
      // converted to HP: 1000 * 500 / 1e6 = 0.5 HP
      expect(wallet.toWithdraw).toBeCloseTo(0.5, 6);
    });

    it("calculates withdrawn correctly when powering down", () => {
      const poweringDownAccount = {
        ...mockAccount,
        next_vesting_withdrawal: "2024-01-15T00:00:00",
        to_withdraw: "1000000000", // 1000 VESTS in satoshis
        withdrawn: "200000000", // 200 VESTS in satoshis (200 * 1e6)
        vesting_withdraw_rate: "76.923077 VESTS"
      };

      const wallet = new HiveWallet(poweringDownAccount, mockDynamicProps);

      // withdrawn should be calculated the same way as toWithdraw:
      // (200000000 / 1e6) = 200 VESTS
      // converted to HP: 200 * 500 / 1e6 = 0.1 HP
      //
      // CURRENT BUG: The code does vestsToHp(200000000, 500 / 1e6)
      // which gives: (200000000 / 1e6) * (500 / 1e6) = 200 * 0.0005 = 0.1
      // This happens to give the correct result by accident!
      //
      // But if withdrawn was not in satoshis (already divided by 1e6):
      // vestsToHp(200, 500 / 1e6) = 200 * 0.0005 = 0.1 (wrong)
      // Should be: vestsToHp(200, 500) = 200 * 500 / 1e6 = 0.1
      expect(wallet.withdrawn).toBeCloseTo(0.1, 6);
    });

    it("toWithdraw and withdrawn should use consistent calculations", () => {
      const poweringDownAccount = {
        ...mockAccount,
        next_vesting_withdrawal: "2024-01-15T00:00:00",
        to_withdraw: "1000000000", // 1000 VESTS in satoshis
        withdrawn: "200000000", // 200 VESTS in satoshis
        vesting_withdraw_rate: "76.923077 VESTS"
      };

      const wallet = new HiveWallet(poweringDownAccount, mockDynamicProps);

      // Both should use the same formula pattern
      // withdrawn should be 20% of toWithdraw
      expect(wallet.withdrawn / wallet.toWithdraw).toBeCloseTo(0.2, 6);
    });
  });

  describe("weeks left calculation", () => {
    it("should not return Infinity when nextVestingSharesWithdrawalHive is 0", () => {
      const nonPoweringDownAccount = {
        ...mockAccount,
        next_vesting_withdrawal: "1969-12-31T23:59:59", // Not powering down
        to_withdraw: "0",
        withdrawn: "0"
      };

      const wallet = new HiveWallet(nonPoweringDownAccount, mockDynamicProps);

      // When not powering down, weeksLeft should be 0 or a finite number
      expect(wallet.weeksLeft).not.toBe(Infinity);
      expect(wallet.weeksLeft).not.toBe(-Infinity);
      expect(Number.isNaN(wallet.weeksLeft)).toBe(false);
    });
  });
});
