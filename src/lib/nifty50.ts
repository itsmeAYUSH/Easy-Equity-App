/**
 * Same list as the website (easyequity-app/src/lib/nifty50.ts): keep both in step.
 *
 * Nifty 50 constituents and their NSE industry, from NSE Indices' official list
 * (ind_nifty50list.csv). Effective 30 Sep 2026: BSE Ltd replaced Wipro.
 *
 * UPDATE AFTER EACH INDEX REVIEW (effective end of March and end of September):
 * download https://www.niftyindices.com/IndexConstituent/ind_nifty50list.csv and
 * compare. `about` lines are short factual descriptions, not opinions.
 */
export const NIFTY50_AS_OF = '30 September 2026';

export type SectorSlug =
  | 'financial-services' | 'information-technology' | 'oil-gas' | 'automobile' | 'fmcg'
  | 'healthcare' | 'metals-mining' | 'construction-materials' | 'consumer-durables'
  | 'consumer-services' | 'power' | 'services' | 'capital-goods' | 'telecom' | 'construction';

export interface NiftyStock {
  /** NSE symbol, as used in URLs (/stock/RELIANCE). */
  symbol: string;
  name: string;
  /** Short name for headings and lists. */
  short: string;
  sector: SectorSlug;
  isin: string;
  about: string;
  /** Words that identify the company in news headlines (matched as whole words). */
  news: string[];
}

export interface Sector {
  slug: SectorSlug;
  name: string;
  /** NSE's industry name for this group. */
  nseIndustry: string;
  /** What the sector is and what usually moves it. Educational, not a view. */
  about: string;
}

export const SECTORS: Sector[] = [
  {
    slug: 'financial-services', name: 'Financial Services', nseIndustry: 'Financial Services',
    about: 'Banks, non-bank lenders (NBFCs), insurers and market infrastructure such as stock exchanges. Their results usually depend on loan growth, interest rates set by the RBI, the quality of loans (bad-loan levels) and, for insurers and exchanges, how active savers and traders are.',
  },
  {
    slug: 'information-technology', name: 'Information Technology', nseIndustry: 'Information Technology',
    about: 'IT services companies that build and run software for clients worldwide, mostly in the US and Europe. Their earnings are in foreign currency, so the rupee exchange rate matters, along with how much global companies spend on technology.',
  },
  {
    slug: 'oil-gas', name: 'Oil, Gas & Consumable Fuels', nseIndustry: 'Oil Gas & Consumable Fuels',
    about: 'Companies that produce, refine or sell oil, gas and coal. Global crude oil prices, government pricing decisions and energy demand are the usual drivers.',
  },
  {
    slug: 'automobile', name: 'Automobile & Auto Components', nseIndustry: 'Automobile and Auto Components',
    about: 'Makers of cars, two-wheelers, tractors and commercial vehicles. Monthly sales numbers, fuel and metal prices, interest rates on vehicle loans and rural demand tend to move these stocks.',
  },
  {
    slug: 'fmcg', name: 'FMCG (Fast Moving Consumer Goods)', nseIndustry: 'Fast Moving Consumer Goods',
    about: 'Companies selling everyday products such as soaps, foods, drinks and tobacco. Demand is fairly steady; raw-material costs, rural spending and price increases drive results.',
  },
  {
    slug: 'healthcare', name: 'Healthcare', nseIndustry: 'Healthcare',
    about: 'Pharmaceutical companies and hospital chains. Drug makers depend on exports (especially to the US), approvals from regulators such as the US FDA and new launches; hospitals on bed occupancy and revenue per patient.',
  },
  {
    slug: 'metals-mining', name: 'Metals & Mining', nseIndustry: 'Metals & Mining',
    about: 'Producers of steel, aluminium, copper and other materials. Their profits swing with global metal prices, demand from China and infrastructure spending, which makes the sector cyclical.',
  },
  {
    slug: 'construction-materials', name: 'Construction Materials', nseIndustry: 'Construction Materials',
    about: 'Cement makers and related businesses. Housing and infrastructure demand, fuel and power costs and cement prices are the main drivers.',
  },
  {
    slug: 'consumer-durables', name: 'Consumer Durables', nseIndustry: 'Consumer Durables',
    about: 'Companies selling longer-lasting consumer products such as paints, jewellery and watches. Discretionary spending, gold and raw-material prices and festive-season demand matter most.',
  },
  {
    slug: 'consumer-services', name: 'Consumer Services', nseIndustry: 'Consumer Services',
    about: 'Retail chains and online consumer platforms such as food delivery and quick commerce. Growth in orders and stores, and progress towards steady profits, are watched closely.',
  },
  {
    slug: 'power', name: 'Power', nseIndustry: 'Power',
    about: 'Electricity generation and transmission companies. Power demand, regulated returns, fuel costs and new capacity (including renewables) drive results.',
  },
  {
    slug: 'services', name: 'Services (Ports & Aviation)', nseIndustry: 'Services',
    about: 'Transport businesses in the Nifty 50: a port operator and an airline. Cargo volumes, passenger traffic, fuel prices and fares are the key numbers.',
  },
  {
    slug: 'capital-goods', name: 'Capital Goods', nseIndustry: 'Capital Goods',
    about: 'Makers of equipment used by other industries and the government, including defence electronics. Order books and government spending drive results.',
  },
  {
    slug: 'telecom', name: 'Telecommunication', nseIndustry: 'Telecommunication',
    about: 'Mobile and broadband operators. Average revenue per user (ARPU), subscriber growth, tariff changes and spending on networks and spectrum are the key numbers.',
  },
  {
    slug: 'construction', name: 'Construction', nseIndustry: 'Construction',
    about: 'Engineering and construction companies that build infrastructure, factories and plants. Order inflow, government capital spending and project execution drive results.',
  },
];

export const NIFTY50: NiftyStock[] = [
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', short: 'Adani Enterprises', sector: 'metals-mining', isin: 'INE423A01024', about: 'Flagship company of the Adani Group, which starts and runs new businesses such as airports, roads, mining services and new energy.', news: ['Adani Enterprises'] },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd.', short: 'Adani Ports', sector: 'services', isin: 'INE742F01042', about: 'Runs ports and logistics across India, including Mundra port and its special economic zone.', news: ['Adani Ports'] },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.', short: 'Apollo Hospitals', sector: 'healthcare', isin: 'INE437A01024', about: 'Runs one of India\'s largest private hospital chains, along with pharmacies and diagnostics.', news: ['Apollo Hospitals'] },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', short: 'Asian Paints', sector: 'consumer-durables', isin: 'INE021A01026', about: 'Paint maker selling decorative and industrial paints and home-décor products.', news: ['Asian Paints'] },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', short: 'Axis Bank', sector: 'financial-services', isin: 'INE238A01034', about: 'One of India\'s large private-sector banks, offering retail, corporate and small-business banking.', news: ['Axis Bank'] },
  { symbol: 'BSE', name: 'BSE Ltd.', short: 'BSE', sector: 'financial-services', isin: 'INE118H01025', about: 'Runs BSE, Asia\'s oldest stock exchange and home of the Sensex index. It earns from trading, listing and data services.', news: ['BSE Ltd', 'BSE shares'] },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', short: 'Bajaj Auto', sector: 'automobile', isin: 'INE917I01010', about: 'Maker of motorcycles and three-wheelers, and a large exporter of two-wheelers.', news: ['Bajaj Auto'] },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', short: 'Bajaj Finance', sector: 'financial-services', isin: 'INE296A01032', about: 'Non-bank lender (NBFC) offering consumer, small-business and other loans.', news: ['Bajaj Finance'] },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', short: 'Bajaj Finserv', sector: 'financial-services', isin: 'INE918I01026', about: 'Holding company for the Bajaj group\'s financial businesses, including Bajaj Finance and its insurance companies.', news: ['Bajaj Finserv'] },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.', short: 'Bharat Electronics', sector: 'capital-goods', isin: 'INE263A01024', about: 'Government-owned maker of defence electronics such as radars and communication systems.', news: ['Bharat Electronics', 'BEL'] },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', short: 'Bharti Airtel', sector: 'telecom', isin: 'INE397D01024', about: 'Telecom operator (Airtel) with mobile, broadband and enterprise services in India and operations in Africa.', news: ['Airtel'] },
  { symbol: 'CIPLA', name: 'Cipla Ltd.', short: 'Cipla', sector: 'healthcare', isin: 'INE059A01026', about: 'Pharmaceutical company known for respiratory and generic medicines, sold in India and abroad.', news: ['Cipla'] },
  { symbol: 'COALINDIA', name: 'Coal India Ltd.', short: 'Coal India', sector: 'oil-gas', isin: 'INE522F01014', about: 'Government-owned company that produces most of India\'s coal.', news: ['Coal India'] },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Ltd.', short: 'Dr. Reddy\'s', sector: 'healthcare', isin: 'INE089A01031', about: 'Pharmaceutical company making generic medicines and active ingredients for India, the US and other markets.', news: ['Dr Reddy', 'Dr. Reddy'] },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', short: 'Eicher Motors', sector: 'automobile', isin: 'INE066A01021', about: 'Maker of Royal Enfield motorcycles, with a commercial-vehicle joint venture with Volvo.', news: ['Eicher', 'Royal Enfield'] },
  { symbol: 'ETERNAL', name: 'Eternal Ltd.', short: 'Eternal (Zomato)', sector: 'consumer-services', isin: 'INE758T01015', about: 'Parent of Zomato (food delivery) and Blinkit (quick commerce). The company was called Zomato Ltd until 2025.', news: ['Eternal', 'Zomato', 'Blinkit'] },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd.', short: 'Grasim', sector: 'construction-materials', isin: 'INE047A01021', about: 'Aditya Birla group company with businesses in cement (through UltraTech), fibres, chemicals and paints.', news: ['Grasim'] },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', short: 'HCLTech', sector: 'information-technology', isin: 'INE860A01027', about: 'IT services company providing software, engineering and digital services to global clients.', news: ['HCLTech', 'HCL Tech', 'HCL Technologies'] },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', short: 'HDFC Bank', sector: 'financial-services', isin: 'INE040A01034', about: 'India\'s largest private-sector bank, which merged with its parent HDFC Ltd in 2023.', news: ['HDFC Bank'] },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd.', short: 'HDFC Life', sector: 'financial-services', isin: 'INE795G01014', about: 'Life insurance company offering protection, savings and pension plans.', news: ['HDFC Life'] },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', short: 'Hindalco', sector: 'metals-mining', isin: 'INE038A01020', about: 'Aditya Birla group\'s aluminium and copper maker, which also owns the global aluminium company Novelis.', news: ['Hindalco', 'Novelis'] },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', short: 'Hindustan Unilever', sector: 'fmcg', isin: 'INE030A01027', about: 'One of India\'s largest consumer-goods companies, with brands in soaps, detergents, foods and personal care.', news: ['Hindustan Unilever', 'HUL'] },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', short: 'ICICI Bank', sector: 'financial-services', isin: 'INE090A01021', about: 'One of India\'s largest private-sector banks, with retail, corporate and digital banking.', news: ['ICICI Bank'] },
  { symbol: 'ITC', name: 'ITC Ltd.', short: 'ITC', sector: 'fmcg', isin: 'INE154A01025', about: 'Company best known for cigarettes, with food and personal-care brands, paperboards and agri businesses.', news: ['ITC'] },
  { symbol: 'INFY', name: 'Infosys Ltd.', short: 'Infosys', sector: 'information-technology', isin: 'INE009A01021', about: 'One of India\'s largest IT services companies, serving global clients in consulting, software and cloud.', news: ['Infosys'] },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation Ltd.', short: 'IndiGo', sector: 'services', isin: 'INE646L01027', about: 'Operates IndiGo, India\'s largest airline by passengers carried.', news: ['IndiGo', 'InterGlobe'] },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', short: 'JSW Steel', sector: 'metals-mining', isin: 'INE019A01038', about: 'One of India\'s largest steel makers, part of the JSW group.', news: ['JSW Steel'] },
  { symbol: 'JIOFIN', name: 'Jio Financial Services Ltd.', short: 'Jio Financial', sector: 'financial-services', isin: 'INE758E01017', about: 'Financial services company separated from Reliance Industries in 2023, with lending, payments and investment businesses.', news: ['Jio Financial'] },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', short: 'Kotak Mahindra Bank', sector: 'financial-services', isin: 'INE237A01036', about: 'Private-sector bank with banking, broking, asset management and insurance businesses.', news: ['Kotak Mahindra Bank', 'Kotak Bank'] },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', short: 'L&T', sector: 'construction', isin: 'INE018A01030', about: 'Engineering and construction company building infrastructure, factories and defence projects, with IT services subsidiaries.', news: ['Larsen', 'L&T'] },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', short: 'Mahindra & Mahindra', sector: 'automobile', isin: 'INE101A01026', about: 'Maker of SUVs, tractors and commercial vehicles, and one of the world\'s largest tractor makers.', news: ['Mahindra & Mahindra', 'M&M'] },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', short: 'Maruti Suzuki', sector: 'automobile', isin: 'INE585B01010', about: 'India\'s largest car maker, majority-owned by Japan\'s Suzuki Motor Corporation.', news: ['Maruti'] },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Institute Ltd.', short: 'Max Healthcare', sector: 'healthcare', isin: 'INE027H01010', about: 'Runs a chain of private hospitals, mainly in north India.', news: ['Max Healthcare'] },
  { symbol: 'NTPC', name: 'NTPC Ltd.', short: 'NTPC', sector: 'power', isin: 'INE733E01010', about: 'Government-owned company that is India\'s largest power generator, mostly from coal, with growing renewables.', news: ['NTPC'] },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', short: 'Nestlé India', sector: 'fmcg', isin: 'INE239A01024', about: 'Indian arm of Nestlé, selling Maggi noodles, coffee, chocolates and dairy products.', news: ['Nestle India', 'Nestlé India'] },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', short: 'ONGC', sector: 'oil-gas', isin: 'INE213A01029', about: 'Government-owned company that produces most of India\'s crude oil and natural gas.', news: ['ONGC'] },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', short: 'Power Grid', sector: 'power', isin: 'INE752E01010', about: 'Government-owned company that runs most of India\'s inter-state power transmission network.', news: ['Power Grid'] },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', short: 'Reliance Industries', sector: 'oil-gas', isin: 'INE002A01018', about: 'Conglomerate with oil-to-chemicals, retail, and Jio digital and telecom businesses.', news: ['Reliance Industries', 'RIL'] },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd.', short: 'SBI Life', sector: 'financial-services', isin: 'INE123W01016', about: 'Life insurer promoted by State Bank of India, selling largely through SBI branches.', news: ['SBI Life'] },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd.', short: 'Shriram Finance', sector: 'financial-services', isin: 'INE721A01047', about: 'Non-bank lender (NBFC) best known for commercial-vehicle loans, also lending to small businesses and individuals.', news: ['Shriram Finance'] },
  { symbol: 'SBIN', name: 'State Bank of India', short: 'SBI', sector: 'financial-services', isin: 'INE062A01020', about: 'India\'s largest bank, majority-owned by the Government of India.', news: ['State Bank of India', 'SBI'] },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', short: 'Sun Pharma', sector: 'healthcare', isin: 'INE044A01036', about: 'India\'s largest pharmaceutical company, with generic and specialty medicines sold worldwide.', news: ['Sun Pharma'] },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', short: 'TCS', sector: 'information-technology', isin: 'INE467B01029', about: 'India\'s largest IT services company, part of the Tata group.', news: ['TCS', 'Tata Consultancy'] },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd.', short: 'Tata Consumer', sector: 'fmcg', isin: 'INE192A01025', about: 'Tata group\'s food and beverage company, with brands such as Tata Tea, Tetley and Tata Salt.', news: ['Tata Consumer'] },
  { symbol: 'TMPV', name: 'Tata Motors Passenger Vehicles Ltd.', short: 'Tata Motors PV', sector: 'automobile', isin: 'INE155A01022', about: 'Tata group\'s passenger car and electric-vehicle business, including Jaguar Land Rover. It took this name in 2025, when the truck and bus business was split off.', news: ['Tata Motors', 'Jaguar Land Rover'] },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', short: 'Tata Steel', sector: 'metals-mining', isin: 'INE081A01020', about: 'One of the world\'s larger steel makers, with plants in India, the Netherlands and the UK.', news: ['Tata Steel'] },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', short: 'Tech Mahindra', sector: 'information-technology', isin: 'INE669C01036', about: 'IT services company of the Mahindra group, with a large telecom-services business.', news: ['Tech Mahindra'] },
  { symbol: 'TITAN', name: 'Titan Company Ltd.', short: 'Titan', sector: 'consumer-durables', isin: 'INE280A01028', about: 'Tata group company selling Tanishq jewellery, watches and eyewear.', news: ['Titan', 'Tanishq'] },
  { symbol: 'TRENT', name: 'Trent Ltd.', short: 'Trent', sector: 'consumer-services', isin: 'INE849A01020', about: 'Tata group\'s retail company, running Westside and Zudio stores.', news: ['Trent', 'Zudio'] },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', short: 'UltraTech Cement', sector: 'construction-materials', isin: 'INE481G01011', about: 'India\'s largest cement maker, part of the Aditya Birla group.', news: ['UltraTech'] },
];

const BY_SYMBOL = new Map(NIFTY50.map((s) => [s.symbol, s]));
const BY_SECTOR = new Map(SECTORS.map((s) => [s.slug, s]));

/** Look up a Nifty 50 stock by NSE symbol (any case; accepts a Yahoo ".NS" suffix). */
export function getNiftyStock(symbol: string): NiftyStock | undefined {
  return BY_SYMBOL.get(symbol.trim().toUpperCase().replace(/\.NS$/, ''));
}

export function getSector(slug: string): Sector | undefined {
  return BY_SECTOR.get(slug as SectorSlug);
}

export function stocksInSector(slug: SectorSlug): NiftyStock[] {
  return NIFTY50.filter((s) => s.sector === slug);
}

/** Yahoo Finance symbol for an NSE-listed stock. */
export function yahooSymbol(symbol: string): string {
  return `${symbol}.NS`;
}

/** URL path for a stock page (symbols like M&M need encoding). */
export function stockPath(symbol: string): string {
  return `/stock/${encodeURIComponent(symbol)}`;
}
