const CONFIG = {
  visionConfig: {
    privateMode: process.env.USE_PRIVATE || "1",
    features: {
      communities: {
        rewards: {
          enabled: true
        }
      },
      hiveWallet: {
        receivedList: {
          enabled: true
        }
      },

      polls: {
        creating: {
          enabled: true
        }
      }
    },
    thirdPartyFeatures: {
      threeSpeak: {
        uploading: {
          enabled: true
        }
      }
    },
    visionFeatures: {
      perks: {
        enabled: true
      },
      userActivityTracking: {
        enabled: true
      },
      points: {
        enabled: true
      },
      decks: {
        enabled: true
      },
      notifications: {
        enabled: true,
        push: {
          enabled: true
        }
      },
      imageServer: {
        enabled: true
      },
      favourites: {
        enabled: true
      },
      bookmarks: {
        enabled: true
      },
      entries: {
        rawContent: {
          enabled: true
        }
      },
      referrals: {
        enabled: true
      },
      gallery: {
        enabled: true
      },
      drafts: {
        enabled: true
      },
      schedules: {
        enabled: true
      },
      fragments: {
        enabled: true
      },
      discover: {
        leaderboard: {
          enabled: true
        },
        curation: {
          enabled: true
        }
      },
      promotions: {
        enabled: true
      },
      editHistory: {
        enabled: true
      }
    },
    service: {
      hsClientId: process.env.HIVESIGNER_ID || "ecency.app",
      hsClientSecret: process.env.HIVESIGNER_SECRET || ""
    }
  }
};

export default CONFIG;
