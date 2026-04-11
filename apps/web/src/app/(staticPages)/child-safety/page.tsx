import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Child Safety Standards",
  description: "Child Safety Standards for the Ecency mobile application published on Google Play."
};

export const dynamic = "force-static";

export default function ChildSafetyPage() {
  return (
    <div className="app-content static-page child-safety-page">
      <div className="static-content">
        <h1 className="page-title">Child Safety Standards - Ecency</h1>
        <p className="static-last-updated">Last Updated March 13, 2026</p>

        <p>Ecency is developed and operated by Ledger Innovation MB.</p>
        <p>
          These Child Safety Standards apply to the Ecency mobile application published on Google
          Play by Ledger Innovation MB.
        </p>
        <p>
          Ecency strictly prohibits child sexual abuse material (CSAM) and any form of child
          sexual abuse or exploitation (CSAE).
        </p>

        <h2>The Ecency platform strictly prohibits</h2>
        <p>Child sexual abuse material (CSAM).</p>
        <p>Sexual exploitation of minors.</p>
        <p>Grooming or solicitation of minors.</p>
        <p>Any content that sexualizes or harms minors.</p>

        <p>
          Accounts involved in such activity will be removed and may be reported to relevant law
          enforcement authorities as required by law.
        </p>

        <h2>Reporting child safety violations</h2>
        <p>
          Users can report content or accounts directly through in-app reporting tools available in
          the Ecency application.
        </p>
        <p>
          Users may also report suspected violations by email using the child safety contact listed
          below.
        </p>

        <h2>Child safety contact</h2>
        <p>Child Safety Contact: safety@ecency.com</p>
        <p>
          Reports should include links, usernames, and relevant details to assist investigation.
        </p>
      </div>
    </div>
  );
}
