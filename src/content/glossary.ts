/**
 * Glossary of market terms for beginners. Plain definitions, India-focused,
 * educational only. Same terms as the website (easyequity-app/src/content/glossary.ts).
 * Keep `slug` stable: other pages link to /glossary#<slug>.
 */
export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  /** Slugs of related terms. */
  related?: string[];
}

export const GLOSSARY: GlossaryTerm[] = [
  { slug: '52-week-high-low', term: '52-week high / low', definition: 'The highest and lowest prices a stock has traded at over the past year. It shows the range the price has moved in, not where it will go next.' },
  { slug: 'amc', term: 'AMC (Asset Management Company)', definition: 'The company that runs mutual funds: it collects money from investors and its fund managers invest it according to each scheme\'s stated goal.', related: ['mutual-fund', 'expense-ratio'] },
  { slug: 'asba', term: 'ASBA', definition: 'Application Supported by Blocked Amount. When you apply for an IPO, the money is only blocked in your bank account (often through a UPI mandate) and is taken only if you get shares.', related: ['ipo'] },
  { slug: 'bear-market', term: 'Bear market', definition: 'A long period of falling prices, often described as a fall of 20% or more from a recent peak.', related: ['bull-market'] },
  { slug: 'blue-chip', term: 'Blue-chip stock', definition: 'An informal name for shares of large, well-established companies with a long record of steady business. It describes the company, not a guarantee of returns.', related: ['market-cap-categories'] },
  { slug: 'bonus-issue', term: 'Bonus issue', definition: 'Free extra shares a company gives existing shareholders, e.g. 1 new share for every 1 held. The price adjusts down, so the total value of your holding stays about the same.', related: ['stock-split'] },
  { slug: 'book-value', term: 'Book value', definition: 'What a company\'s assets are worth on its balance sheet after subtracting its liabilities. Per share, it is compared with the share price in the P/B ratio.', related: ['pb-ratio'] },
  { slug: 'bse', term: 'BSE', definition: 'One of India\'s two main stock exchanges, based in Mumbai and founded in 1875. Its best-known index is the Sensex.', related: ['nse', 'sensex'] },
  { slug: 'bull-market', term: 'Bull market', definition: 'A long period of rising prices and generally positive sentiment.', related: ['bear-market'] },
  { slug: 'buyback', term: 'Buyback', definition: 'When a company buys its own shares back from shareholders, reducing the number of shares in the market.' },
  { slug: 'cagr', term: 'CAGR', definition: 'Compound annual growth rate: the steady yearly rate that would take a starting value to an ending value over a period. Try our CAGR calculator.', related: ['xirr'] },
  { slug: 'capital-gains', term: 'Capital gains (STCG / LTCG)', definition: 'The profit when you sell an investment for more than you paid. In India, listed shares held 12 months or less give short-term gains (STCG); held longer, long-term gains (LTCG), taxed differently.', related: ['stt'] },
  { slug: 'circuit-limit', term: 'Circuit limit', definition: 'The maximum a stock\'s price may move up or down in one day (for example 5%, 10% or 20%), set by the exchange to limit wild swings. Separate market-wide circuit breakers pause all trading if an index falls sharply.' },
  { slug: 'debt-to-equity', term: 'Debt-to-equity ratio', definition: 'A company\'s borrowings divided by its shareholders\' equity. A higher number means the business relies more on debt.' },
  { slug: 'delivery-trade', term: 'Delivery trade', definition: 'Buying shares and keeping them in your demat account beyond the day you bought them, as opposed to intraday trading.', related: ['intraday', 'demat-account'] },
  { slug: 'demat-account', term: 'Demat account', definition: 'An account that holds your shares and other securities in electronic form, kept with a depository (NSDL or CDSL) through a broker or bank.' },
  { slug: 'derivatives', term: 'Derivatives (F&O)', definition: 'Contracts such as futures and options whose value depends on another asset, like a stock or an index. They involve leverage and are high-risk; SEBI studies have found most individual F&O traders lose money.' },
  { slug: 'dii', term: 'DII', definition: 'Domestic institutional investors: Indian institutions such as mutual funds, insurers and pension funds that invest in the market. Their daily buying and selling is often reported alongside FPI flows.', related: ['fpi'] },
  { slug: 'dividend', term: 'Dividend', definition: 'A share of profits a company pays to its shareholders, usually as cash per share. Companies are not required to pay one.', related: ['dividend-yield'] },
  { slug: 'dividend-yield', term: 'Dividend yield', definition: 'Yearly dividend per share divided by the share price, as a percentage. It changes as the price moves.', related: ['dividend'] },
  { slug: 'elss', term: 'ELSS', definition: 'Equity-linked savings scheme: an equity mutual fund with a 3-year lock-in that qualifies for a tax deduction under the old income-tax regime.', related: ['mutual-fund'] },
  { slug: 'eps', term: 'EPS (Earnings per share)', definition: 'A company\'s net profit divided by its number of shares. It is the "E" in the P/E ratio.', related: ['pe-ratio'] },
  { slug: 'exit-load', term: 'Exit load', definition: 'A fee some mutual funds charge if you sell (redeem) units before a set period, such as within one year.', related: ['mutual-fund'] },
  { slug: 'expense-ratio', term: 'Expense ratio', definition: 'The yearly fee a mutual fund charges, as a percentage of your investment, taken out of the fund\'s value. Direct plans have lower expense ratios than regular plans because no distributor commission is paid.', related: ['amc', 'nav'] },
  { slug: 'face-value', term: 'Face value', definition: 'The nominal value printed on a share (often ₹1, ₹2 or ₹10). It is used for accounting and dividends announced as a percentage, and is unrelated to the market price.' },
  { slug: 'fpi', term: 'FPI / FII', definition: 'Foreign portfolio investors (earlier called foreign institutional investors): overseas funds and institutions that buy Indian shares and bonds. Their flows can move the market.', related: ['dii'] },
  { slug: 'free-float', term: 'Free float', definition: 'The part of a company\'s shares available for trading by the public, excluding promoter and other locked-in holdings. Indices like the Nifty 50 weight companies by free-float market cap.', related: ['market-cap'] },
  { slug: 'gmp', term: 'GMP (Grey market premium)', definition: 'An unofficial, unregulated estimate of how much above (or below) its issue price an IPO might list, based on informal trading before listing. It is often wrong and is not an exchange price.', related: ['ipo'] },
  { slug: 'index', term: 'Index', definition: 'A number that tracks the combined price of a group of shares, such as the Nifty 50 or Sensex, to show how that part of the market is doing.', related: ['nifty-50', 'sensex'] },
  { slug: 'inflation', term: 'Inflation', definition: 'The rate at which prices of goods and services rise, which reduces what money can buy. In India it is commonly measured by the Consumer Price Index (CPI).', related: ['repo-rate'] },
  { slug: 'intraday', term: 'Intraday trading', definition: 'Buying and selling the same stock within one trading day, so no shares end up in your demat account. Profits and losses are treated as business income for tax.', related: ['delivery-trade'] },
  { slug: 'ipo', term: 'IPO (Initial public offering)', definition: 'When a company sells shares to the public for the first time and lists on a stock exchange. Investors apply during a set window at a price within the price band.', related: ['price-band', 'lot-size', 'gmp', 'asba'] },
  { slug: 'liquidity', term: 'Liquidity', definition: 'How easily you can buy or sell something without moving its price much. Heavily traded large-company shares are usually more liquid than small-company shares.', related: ['volume'] },
  { slug: 'lot-size', term: 'Lot size', definition: 'The minimum number of shares you must apply for in an IPO (or trade in an F&O contract). You apply in multiples of it.', related: ['ipo'] },
  { slug: 'market-cap', term: 'Market capitalisation', definition: 'The total market value of a company: share price × number of shares. It is a measure of size, not of whether the shares are cheap or expensive.', related: ['market-cap-categories', 'free-float'] },
  { slug: 'market-cap-categories', term: 'Large, mid and small cap', definition: 'SEBI\'s size groups: the 100 largest listed companies by market cap are large caps, numbers 101 to 250 are mid caps, and the rest are small caps.', related: ['market-cap'] },
  { slug: 'mutual-fund', term: 'Mutual fund', definition: 'A pool of money from many investors, managed by professionals and invested in shares, bonds or both. You own units, whose value is the NAV.', related: ['nav', 'sip', 'amc'] },
  { slug: 'nav', term: 'NAV (Net asset value)', definition: 'The price of one unit of a mutual fund, worked out once a day from the value of everything the fund owns minus expenses, divided by the number of units.', related: ['mutual-fund'] },
  { slug: 'nifty-50', term: 'Nifty 50', definition: 'An index of 50 large, actively traded companies listed on the NSE, run by NSE Indices. It is reviewed twice a year and is the most-watched gauge of the Indian market.', related: ['index', 'sensex', 'nse'] },
  { slug: 'nse', term: 'NSE', definition: 'National Stock Exchange of India, the country\'s largest stock exchange by trading volume, based in Mumbai. Its main index is the Nifty 50.', related: ['bse', 'nifty-50'] },
  { slug: 'pb-ratio', term: 'P/B ratio (Price-to-book)', definition: 'Share price divided by book value per share. Often used to compare banks and other asset-heavy businesses.', related: ['book-value', 'pe-ratio'] },
  { slug: 'pe-ratio', term: 'P/E ratio (Price-to-earnings)', definition: 'Share price divided by earnings per share. It shows how much the market pays for each rupee of profit; it means little on its own and is usually compared with similar companies or the company\'s own history.', related: ['eps', 'pb-ratio'] },
  { slug: 'portfolio', term: 'Portfolio', definition: 'All the investments you hold together, such as shares, mutual funds, bonds and deposits.' },
  { slug: 'price-band', term: 'Price band', definition: 'The range of prices, such as ₹100 to ₹110, within which investors can bid for shares in an IPO.', related: ['ipo'] },
  { slug: 'repo-rate', term: 'Repo rate', definition: 'The interest rate at which the Reserve Bank of India lends short-term money to banks. Changes to it affect loan and deposit rates across the economy.', related: ['inflation'] },
  { slug: 'rights-issue', term: 'Rights issue', definition: 'An offer to existing shareholders to buy additional new shares, usually at a discount, in proportion to what they already hold.' },
  { slug: 'roe', term: 'ROE (Return on equity)', definition: 'Net profit divided by shareholders\' equity, as a percentage. It shows how much profit a company makes with the money shareholders have put in.' },
  { slug: 'sebi', term: 'SEBI', definition: 'Securities and Exchange Board of India, the regulator for stock markets, brokers, mutual funds and investment advisers. You can check whether an adviser is registered on its website.' },
  { slug: 'sensex', term: 'Sensex', definition: 'An index of 30 large companies listed on the BSE, India\'s oldest stock index (base year 1978-79).', related: ['bse', 'nifty-50', 'index'] },
  { slug: 'settlement', term: 'Settlement (T+1)', definition: 'The process of delivering shares to the buyer and money to the seller. In India most trades settle on the next working day after the trade (T+1).', related: ['demat-account'] },
  { slug: 'sip', term: 'SIP (Systematic investment plan)', definition: 'Investing a fixed amount in a mutual fund at regular intervals, usually monthly. You buy more units when prices are low and fewer when they are high.', related: ['mutual-fund', 'swp'] },
  { slug: 'stock-split', term: 'Stock split', definition: 'When a company divides each share into several, e.g. one ₹10 share into five ₹2 shares. The price per share falls in proportion; your total value stays the same.', related: ['bonus-issue'] },
  { slug: 'stt', term: 'STT (Securities transaction tax)', definition: 'A tax charged on buying and selling shares and derivatives on Indian exchanges, collected by your broker. See our brokerage calculator for current rates.' },
  { slug: 'support-resistance', term: 'Support and resistance', definition: 'Price levels where a stock has previously tended to stop falling (support) or stop rising (resistance). They describe past behaviour and often break.' },
  { slug: 'swp', term: 'SWP (Systematic withdrawal plan)', definition: 'Taking a fixed amount out of a mutual fund at regular intervals, often used for regular income.', related: ['sip'] },
  { slug: 'volatility', term: 'Volatility', definition: 'How much and how quickly a price moves up and down. Higher volatility means bigger swings in both directions.' },
  { slug: 'volume', term: 'Volume', definition: 'The number of shares traded in a period, such as a day. High volume means many people are buying and selling.', related: ['liquidity'] },
  { slug: 'xirr', term: 'XIRR', definition: 'An annual return that accounts for money invested or withdrawn at different times, such as SIP instalments. It is the fair way to measure SIP returns.', related: ['cagr', 'sip'] },
];

export const GLOSSARY_BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]));
