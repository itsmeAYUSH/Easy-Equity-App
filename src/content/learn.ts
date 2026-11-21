/**
 * Beginner guides, the same as the website's /learn pages (generated from
 * easyequity-app/src/content/learn.tsx). Educational only: they explain how
 * things work and never suggest what to buy or sell.
 *
 * A span may point to a glossary term (`term`) or a website path (`link`);
 * the guide screen opens app screens for paths the app has.
 */
export type Span = { text: string; bold?: boolean; term?: string; link?: string }
export type Block = { type: "p" | "h2"; spans: Span[] } | { type: "ul" | "ol"; items: Span[][] }

export interface Guide {
  slug: string
  title: string
  description: string
  minutes: number
  /** Glossary slugs to list at the end. */
  terms: string[]
  body: Block[]
}

export const GUIDES: Guide[] = [
  {
    "slug": "how-the-stock-market-works",
    "title": "How the stock market works in India",
    "description": "Exchanges, brokers, demat accounts, SEBI and what happens when you buy a share, explained from scratch.",
    "minutes": 5,
    "terms": [
      "nse",
      "bse",
      "sebi",
      "demat-account",
      "settlement",
      "circuit-limit"
    ],
    "body": [
      {
        "type": "p",
        "spans": [
          {
            "text": "A share is a small piece of ownership in a company. When a company lists on a stock exchange, its shares can be bought and sold by the public. The price moves all day as buyers and sellers agree on trades."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "The main players"
          }
        ]
      },
      {
        "type": "ul",
        "items": [
          [
            {
              "text": "Stock exchanges.",
              "bold": true
            },
            {
              "text": " India has two main ones: the "
            },
            {
              "text": "NSE",
              "term": "nse"
            },
            {
              "text": " and the "
            },
            {
              "text": "BSE",
              "term": "bse"
            },
            {
              "text": ". Most large companies are listed on both."
            }
          ],
          [
            {
              "text": "SEBI.",
              "bold": true
            },
            {
              "text": " The "
            },
            {
              "text": "Securities and Exchange Board of India",
              "term": "sebi"
            },
            {
              "text": " regulates exchanges, brokers, mutual funds and advisers, and protects investors."
            }
          ],
          [
            {
              "text": "Brokers.",
              "bold": true
            },
            {
              "text": " You can't trade on an exchange directly; you place orders through a SEBI-registered stockbroker, usually in an app."
            }
          ],
          [
            {
              "text": "Depositories.",
              "bold": true
            },
            {
              "text": " NSDL and CDSL hold your shares electronically in a "
            },
            {
              "text": "demat account",
              "term": "demat-account"
            },
            {
              "text": ", which you open through your broker."
            }
          ]
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "What happens when you buy a share"
          }
        ]
      },
      {
        "type": "ol",
        "items": [
          [
            {
              "text": "You place an order in your broker's app, either at the market price or at a price limit you choose."
            }
          ],
          [
            {
              "text": "The exchange matches your order with a seller's order."
            }
          ],
          [
            {
              "text": "The trade "
            },
            {
              "text": "settles",
              "term": "settlement"
            },
            {
              "text": " on the next working day (T+1): the shares arrive in your demat account and the money goes to the seller."
            }
          ]
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Trading hours"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Indian exchanges trade from 9:15 am to 3:30 pm, Monday to Friday, after a short pre-open session from 9:00 am. They close on weekends and "
          },
          {
            "text": "market holidays",
            "link": "/market-holidays"
          },
          {
            "text": "."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Why prices move"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "In the short run, prices move with news, company results, interest rates, global markets and the flows of big investors like mutual funds and foreign funds. Over long periods, share prices tend to follow how much the business earns. To stop extreme swings, exchanges set daily "
          },
          {
            "text": "circuit limits",
            "term": "circuit-limit"
          },
          {
            "text": "."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Costs to know about"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Every trade carries charges: brokerage, "
          },
          {
            "text": "STT",
            "term": "stt"
          },
          {
            "text": ", exchange fees, stamp duty and GST. Our "
          },
          {
            "text": "brokerage calculator",
            "link": "/calculators/brokerage"
          },
          {
            "text": " shows them for any trade."
          }
        ]
      }
    ]
  },
  {
    "slug": "nifty-50-and-sensex",
    "title": "What are the Nifty 50 and the Sensex?",
    "description": "What India's two headline indices measure, how they are built and why the news reports them every day.",
    "minutes": 4,
    "terms": [
      "index",
      "nifty-50",
      "sensex",
      "free-float",
      "market-cap"
    ],
    "body": [
      {
        "type": "p",
        "spans": [
          {
            "text": "An "
          },
          {
            "text": "index",
            "term": "index"
          },
          {
            "text": " is a single number that tracks the combined price of a group of shares. When the news says \"the market rose 1%\", it usually means one of these two indices did."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "The Nifty 50"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The "
          },
          {
            "text": "Nifty 50",
            "term": "nifty-50"
          },
          {
            "text": " follows 50 large, frequently traded companies listed on the NSE, from banks and IT firms to carmakers and consumer brands. Bigger companies count for more: each company's weight depends on its "
          },
          {
            "text": "free-float",
            "term": "free-float"
          },
          {
            "text": " "
          },
          {
            "text": "market capitalisation",
            "term": "market-cap"
          },
          {
            "text": ". NSE Indices reviews the list twice a year and swaps companies in and out. See the "
          },
          {
            "text": "current Nifty 50 companies",
            "link": "/stocks"
          },
          {
            "text": "."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "The Sensex"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The "
          },
          {
            "text": "Sensex",
            "term": "sensex"
          },
          {
            "text": " tracks 30 large companies listed on the BSE. It is India's oldest index, with a base value of 100 in 1978-79. Because the two indices hold many of the same big companies, they usually move in the same direction on most days."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Why they matter to you"
          }
        ]
      },
      {
        "type": "ul",
        "items": [
          [
            {
              "text": "They give a quick read on how large Indian companies are doing as a group."
            }
          ],
          [
            {
              "text": "Index funds and ETFs copy them, so you can invest in the whole basket at once."
            }
          ],
          [
            {
              "text": "Fund performance is often compared with them as a benchmark."
            }
          ]
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "A rising index doesn't mean every stock rose: some companies in it can fall on the same day. Browse them by "
          },
          {
            "text": "sector",
            "link": "/sectors"
          },
          {
            "text": "."
          }
        ]
      }
    ]
  },
  {
    "slug": "how-to-read-a-stock-page",
    "title": "How to read a stock page",
    "description": "Price, change, 52-week range, market cap, P/E and volume: what each number on a stock page means.",
    "minutes": 5,
    "terms": [
      "market-cap",
      "pe-ratio",
      "eps",
      "52-week-high-low",
      "volume",
      "dividend-yield"
    ],
    "body": [
      {
        "type": "p",
        "spans": [
          {
            "text": "Stock pages are full of numbers. Here is what the common ones mean and what they don't tell you."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Price and change"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The "
          },
          {
            "text": "last price",
            "bold": true
          },
          {
            "text": " is the latest traded price. The "
          },
          {
            "text": "change",
            "bold": true
          },
          {
            "text": " compares it with the previous day's closing price, in rupees and percent. Free data sources can lag the exchange by a few minutes."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "52-week range"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The "
          },
          {
            "text": "52-week high and low",
            "term": "52-week-high-low"
          },
          {
            "text": " show the highest and lowest prices of the past year. They give context for today's price, but a stock near its low isn't necessarily cheap, and one near its high isn't necessarily expensive."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Market capitalisation"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Market cap",
            "term": "market-cap"
          },
          {
            "text": " is the share price multiplied by the number of shares: the market value of the whole company. It tells you the company's size. SEBI groups companies into "
          },
          {
            "text": "large, mid and small caps",
            "term": "market-cap-categories"
          },
          {
            "text": " by this number."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "P/E ratio"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The "
          },
          {
            "text": "price-to-earnings ratio",
            "term": "pe-ratio"
          },
          {
            "text": " divides the share price by "
          },
          {
            "text": "earnings per share",
            "term": "eps"
          },
          {
            "text": ". A P/E of 25 means investors pay ₹25 for each ₹1 of yearly profit. Different industries have very different typical P/Es, so it is only useful when comparing similar companies."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Volume"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Volume",
            "term": "volume"
          },
          {
            "text": " is how many shares changed hands. A big price move on high volume means many investors took part; on low volume, a few trades moved the price."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "What a stock page can't tell you"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "None of these numbers says whether to buy or sell. They describe the past and present, not the future. Read the company's results and annual report, and if you want personal advice, speak to a SEBI-registered adviser."
          }
        ]
      }
    ]
  },
  {
    "slug": "ipos-explained",
    "title": "IPOs explained: price band, lot size, allotment and GMP",
    "description": "How applying for an IPO works in India, from the price band and lot size to allotment, listing day and what GMP really is.",
    "minutes": 6,
    "terms": [
      "ipo",
      "price-band",
      "lot-size",
      "asba",
      "gmp",
      "demat-account"
    ],
    "body": [
      {
        "type": "p",
        "spans": [
          {
            "text": "In an "
          },
          {
            "text": "IPO (initial public offering)",
            "term": "ipo"
          },
          {
            "text": ", a company sells shares to the public for the first time and then lists on the stock exchanges. Here is how the process works for an individual investor."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "1. Before it opens"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The company publishes its offer document (the red herring prospectus) with details of its business, finances and risks, and announces a "
          },
          {
            "text": "price band",
            "term": "price-band"
          },
          {
            "text": " (for example ₹100 to ₹110) and a "
          },
          {
            "text": "lot size",
            "term": "lot-size"
          },
          {
            "text": ", the minimum number of shares per application."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "2. Applying"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The IPO is usually open for three working days. You apply through your broker or bank, choosing how many lots and at what price within the band. The money is not taken straight away; it is blocked in your bank account through "
          },
          {
            "text": "ASBA",
            "term": "asba"
          },
          {
            "text": ", usually approved with a UPI mandate. Individual investors applying for up to ₹2 lakh fall in the retail category."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "3. Subscription"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Exchanges show how many times each category was subscribed. If retail demand is much higher than the shares on offer, allotment is decided by a lottery, so many applicants get nothing."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "4. Allotment and refund"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Allotment is finalised soon after the issue closes. If you get shares, the blocked amount is debited and shares are credited to your "
          },
          {
            "text": "demat account",
            "term": "demat-account"
          },
          {
            "text": "; if not, the block is released."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "5. Listing day"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Shares start trading on the exchanges about three working days after the issue closes. The listing price can be above or below the issue price."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "What GMP is (and isn't)"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "The "
          },
          {
            "text": "grey market premium",
            "term": "gmp"
          },
          {
            "text": " is an unofficial estimate of the listing price based on informal deals before listing. It is unregulated and often wrong, especially when sentiment changes quickly. Treat it as gossip, not a forecast."
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Follow current issues, dates and subscription on our "
          },
          {
            "text": "IPO tracker",
            "link": "/ipo"
          },
          {
            "text": ", and turn on reminders for the dates you care about."
          }
        ]
      }
    ]
  },
  {
    "slug": "mutual-funds-and-sip-basics",
    "title": "Mutual funds and SIPs: the basics",
    "description": "What a mutual fund is, how NAV and expense ratios work, direct vs regular plans, and how a SIP works.",
    "minutes": 5,
    "terms": [
      "mutual-fund",
      "nav",
      "expense-ratio",
      "sip",
      "exit-load",
      "elss",
      "xirr"
    ],
    "body": [
      {
        "type": "p",
        "spans": [
          {
            "text": "A "
          },
          {
            "text": "mutual fund",
            "term": "mutual-fund"
          },
          {
            "text": " pools money from many investors and invests it according to a stated goal, such as large Indian companies, government bonds or a mix. Professional managers at an "
          },
          {
            "text": "asset management company",
            "term": "amc"
          },
          {
            "text": " run it, under SEBI's rules."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Units and NAV"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "When you invest, you buy units. The price of one unit is the "
          },
          {
            "text": "NAV (net asset value)",
            "term": "nav"
          },
          {
            "text": ", worked out once each business day from the value of the fund's holdings. A lower NAV doesn't make a fund cheaper; what matters is how the holdings perform."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Costs"
          }
        ]
      },
      {
        "type": "ul",
        "items": [
          [
            {
              "text": "Expense ratio",
              "bold": true,
              "term": "expense-ratio"
            },
            {
              "text": ":",
              "bold": true
            },
            {
              "text": " a yearly fee taken from the fund's value."
            }
          ],
          [
            {
              "text": "Direct vs regular plans:",
              "bold": true
            },
            {
              "text": " the same fund comes in two versions. Direct plans have no distributor commission, so their expense ratio is lower."
            }
          ],
          [
            {
              "text": "Exit load",
              "bold": true,
              "term": "exit-load"
            },
            {
              "text": ":",
              "bold": true
            },
            {
              "text": " some funds charge a fee if you sell within a set period."
            }
          ]
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "SIP or lumpsum"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "A "
          },
          {
            "text": "SIP (systematic investment plan)",
            "term": "sip"
          },
          {
            "text": " invests a fixed amount every month. Because the amount is fixed, you buy more units when the NAV is low and fewer when it is high. A lumpsum invests everything at once. Use our "
          },
          {
            "text": "SIP calculator",
            "link": "/sip-calculator"
          },
          {
            "text": " to see how regular investing adds up, and measure SIP returns with "
          },
          {
            "text": "XIRR",
            "term": "xirr"
          },
          {
            "text": "."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Tax, briefly"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Selling units can lead to capital gains tax; "
          },
          {
            "text": "ELSS",
            "term": "elss"
          },
          {
            "text": " funds have a 3-year lock-in and a tax benefit under the old regime. Estimate tax with our "
          },
          {
            "text": "capital gains calculator",
            "link": "/calculators/capital-gains"
          },
          {
            "text": "."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Before you invest"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Read the scheme's documents, check its risk level (the \"riskometer\"), and remember that past returns don't guarantee future returns. "
          },
          {
            "text": "Look up fund NAVs",
            "link": "/mutual-funds"
          },
          {
            "text": "."
          }
        ]
      }
    ]
  },
  {
    "slug": "reading-market-news",
    "title": "How to read market news without overreacting",
    "description": "Why markets often react differently from headlines, what \"priced in\" means, and how to use AI impact labels sensibly.",
    "minutes": 4,
    "terms": [
      "volatility",
      "repo-rate",
      "inflation",
      "fpi"
    ],
    "body": [
      {
        "type": "p",
        "spans": [
          {
            "text": "Market news arrives all day, and headlines are written to grab attention. A few habits help you understand it without being pushed around by it."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Expectations matter more than the headline"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Prices already reflect what investors expect. If a company was expected to grow profit by 20% and grows it by 15%, the share can fall even though \"profit rose 15%\". When news was widely expected, people say it was \"priced in\"."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Know the big drivers"
          }
        ]
      },
      {
        "type": "ul",
        "items": [
          [
            {
              "text": "Interest rates:",
              "bold": true
            },
            {
              "text": " the RBI's "
            },
            {
              "text": "repo rate",
              "term": "repo-rate"
            },
            {
              "text": " affects loans, deposits and company borrowing costs."
            }
          ],
          [
            {
              "text": "Inflation:",
              "bold": true
            },
            {
              "text": " rising "
            },
            {
              "text": "prices",
              "term": "inflation"
            },
            {
              "text": " can lead to higher interest rates."
            }
          ],
          [
            {
              "text": "Money flows:",
              "bold": true
            },
            {
              "text": " buying and selling by "
            },
            {
              "text": "foreign investors",
              "term": "fpi"
            },
            {
              "text": " and domestic funds can move the whole market."
            }
          ],
          [
            {
              "text": "Company results:",
              "bold": true
            },
            {
              "text": " quarterly earnings and management commentary."
            }
          ]
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Check the source"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Prefer reports that quote company filings, exchange announcements or official data. Be careful with messages on social media or chat groups that promise \"sure-shot\" tips; SEBI regularly warns investors about these."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "About our impact labels"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "EasyEquity tags news as bullish, bearish or neutral using AI. It is a quick reading of one headline, not a forecast, and markets often react differently. Use the \"Explain in simple words\" button on any story to understand what happened. See "
          },
          {
            "text": "how our AI works",
            "link": "/how-our-ai-works"
          },
          {
            "text": "."
          }
        ]
      },
      {
        "type": "h2",
        "spans": [
          {
            "text": "Zoom out"
          }
        ]
      },
      {
        "type": "p",
        "spans": [
          {
            "text": "Daily "
          },
          {
            "text": "volatility",
            "term": "volatility"
          },
          {
            "text": " is normal. Over months and years, company earnings and the economy matter more than any single day's news."
          }
        ]
      }
    ]
  }
]
