const CONFIG = {
  visionConfig: {
    privateMode: process.env.NEXT_PUBLIC_USE_PRIVATE || "1",
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
      },
      center: {
        enabled: true
      },
      plausible: {
        enabled: true,
        host: "https://pl.ecency.com",
        siteId: "ecency.com",
        apiKey: process.env.PLAUSIBLE_API_KEY
      },
      waves: {
        enabled: true
      },
      publish: {
        geoPicker: {
          enabled: true,
          gMapsMapId: process.env.NEXT_PUBLIC_GMAPS_MAP_ID,
          gMapsApiKey: process.env.NEXT_PUBLIC_GMAPS_API_KEY
        }
      }
    },
    service: {
      hsClientId: process.env.NEXT_PUBLIC_HS_CLIENT_ID || "ecency.app",
      hsClientSecret: process.env.NEXT_PUBLIC_HS_CLIENT_SECRET || ""
    }
  }
};

export default CONFIG;
