export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

function cur(code: string, name: string, symbol: string): Currency {
  return { code, name, symbol };
}

export const currencies: Currency[] = [
  cur('AED', 'UAE Dirham', 'د.إ'),
  cur('ARS', 'Argentine Peso', '$'),
  cur('AUD', 'Australian Dollar', 'A$'),
  cur('BGN', 'Bulgarian Lev', 'лв'),
  cur('BRL', 'Brazilian Real', 'R$'),
  cur('CAD', 'Canadian Dollar', 'C$'),
  cur('CHF', 'Swiss Franc', 'CHF'),
  cur('CLP', 'Chilean Peso', '$'),
  cur('CNY', 'Chinese Yuan', '¥'),
  cur('COP', 'Colombian Peso', '$'),
  cur('CZK', 'Czech Koruna', 'Kč'),
  cur('DKK', 'Danish Krone', 'kr'),
  cur('EGP', 'Egyptian Pound', 'E£'),
  cur('EUR', 'Euro', '€'),
  cur('GBP', 'British Pound', '£'),
  cur('GEL', 'Georgian Lari', '₾'),
  cur('GHS', 'Ghanaian Cedi', 'GH₵'),
  cur('HKD', 'Hong Kong Dollar', 'HK$'),
  cur('HRK', 'Croatian Kuna', 'kn'),
  cur('HUF', 'Hungarian Forint', 'Ft'),
  cur('IDR', 'Indonesian Rupiah', 'Rp'),
  cur('ILS', 'Israeli Shekel', '₪'),
  cur('INR', 'Indian Rupee', '₹'),
  cur('ISK', 'Icelandic Krona', 'kr'),
  cur('JPY', 'Japanese Yen', '¥'),
  cur('KES', 'Kenyan Shilling', 'KSh'),
  cur('KRW', 'South Korean Won', '₩'),
  cur('KWD', 'Kuwaiti Dinar', 'د.ك'),
  cur('MAD', 'Moroccan Dirham', 'MAD'),
  cur('MXN', 'Mexican Peso', 'MX$'),
  cur('MYR', 'Malaysian Ringgit', 'RM'),
  cur('NGN', 'Nigerian Naira', '₦'),
  cur('NOK', 'Norwegian Krone', 'kr'),
  cur('NZD', 'New Zealand Dollar', 'NZ$'),
  cur('PEN', 'Peruvian Sol', 'S/.'),
  cur('PHP', 'Philippine Peso', '₱'),
  cur('PKR', 'Pakistani Rupee', '₨'),
  cur('PLN', 'Polish Zloty', 'zł'),
  cur('QAR', 'Qatari Riyal', 'ر.ق'),
  cur('RON', 'Romanian Leu', 'lei'),
  cur('RUB', 'Russian Ruble', '₽'),
  cur('SAR', 'Saudi Riyal', 'ر.س'),
  cur('SEK', 'Swedish Krona', 'kr'),
  cur('SGD', 'Singapore Dollar', 'S$'),
  cur('THB', 'Thai Baht', '฿'),
  cur('TRY', 'Turkish Lira', '₺'),
  cur('TWD', 'Taiwan Dollar', 'NT$'),
  cur('UAH', 'Ukrainian Hryvnia', '₴'),
  cur('USD', 'US Dollar', '$'),
  cur('UYU', 'Uruguayan Peso', '$U'),
  cur('VND', 'Vietnamese Dong', '₫'),
  cur('ZAR', 'South African Rand', 'R'),
];
