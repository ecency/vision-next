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
      analytics: {
        plausible: {
          domain: process.env.PLAUSIBLE_API_HOST || "https://pl.ecency.com"
        }
      },
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
      rcTopup: {
        enabled: true
      },
      editHistory: {
        enabled: true
      },
      chats: {
        enabled: true
      },
      waves: {
        enabled: true
      },
      plausible: {
        enabled: true,
        host: process.env.PLAUSIBLE_API_HOST || "https://pl.ecency.com",
        siteId: process.env.PLAUSIBLE_DOMAIN || "ecency.com",
        apiKey: process.env.PLAUSIBLE_API_KEY
      },
      publish: {
        geoPicker: {
          enabled: true,
          // Open-source geocoder (Photon by Komoot) used for the search
          // fallback + reverse geocoding. Self-hostable — override via env.
          geocoderHost: process.env.NEXT_PUBLIC_GEOCODER_HOST || "https://photon.komoot.io",
          // Code-split cities dataset served from /public for instant offline
          // typeahead (kept out of the JS bundle).
          citiesDataUrl: "/geo/cities.min.json",
          // Map tiles. Defaults to OpenStreetMap; point at a tile provider /
          // self-hosted server for production-scale traffic.
          tileUrl:
            process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
      },
      aiImageGenerator: {
        enabled: true
      },
      aiAssist: {
        enabled: true
      }
    },
    service: {
      hsClientId: process.env.HIVESIGNER_CLIENT_ID || "ecency.app",
      hsClientSecret: process.env.HIVESIGNER_SECRET || ""
    }
  }
};

export default CONFIG;
