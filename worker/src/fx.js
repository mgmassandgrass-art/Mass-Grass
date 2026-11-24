// The visitor's own currency (owner, 24 Nov 2026): prices are kept and charged in euros (PayPal converts at payment), but
// pages show them in the currency of the country the visitor is in, at the day's rate. Rates come from open.er-api.com
// (EUR base, no key), kept in settings 'fx' for 12 hours; the admin's Settings → rates can pin any currency's rate.
import { getSetting } from './shop.js';

// Country (ISO 3166) → currency (ISO 4217); a country not listed shows euros.
const MAP = `AE:AED SA:SAR KW:KWD QA:QAR BH:BHD OM:OMR EG:EGP JO:JOD LB:LBP IQ:IQD PS:ILS IL:ILS YE:YER TR:TRY IR:IRR SD:SDG LY:LYD TN:TND
DZ:DZD MA:MAD MR:MRU DJ:DJF SO:SOS KM:KMF SY:SYP GB:GBP CH:CHF LI:CHF NO:NOK SE:SEK DK:DKK IS:ISK PL:PLN CZ:CZK HU:HUF RO:RON BG:BGN
RS:RSD BA:BAM MK:MKD AL:ALL MD:MDL UA:UAH BY:BYN RU:RUB GE:GEL AM:AMD AZ:AZN US:USD CA:CAD MX:MXN BR:BRL AR:ARS CL:CLP CO:COP PE:PEN
UY:UYU PY:PYG BO:BOB VE:VES EC:USD PA:USD SV:USD CR:CRC GT:GTQ HN:HNL NI:NIO DO:DOP JM:JMD TT:TTD BS:BSD BB:BBD BZ:BZD HT:HTG CU:CUP
GY:GYD SR:SRD AG:XCD DM:XCD GD:XCD KN:XCD LC:XCD VC:XCD IN:INR PK:PKR BD:BDT LK:LKR NP:NPR BT:BTN MV:MVR AF:AFN CN:CNY HK:HKD TW:TWD
JP:JPY KR:KRW KP:KPW MN:MNT KZ:KZT UZ:UZS KG:KGS TJ:TJS TM:TMT TH:THB VN:VND KH:KHR LA:LAK MM:MMK MY:MYR SG:SGD BN:BND ID:IDR PH:PHP
TL:USD AU:AUD NZ:NZD FJ:FJD PG:PGK ZA:ZAR NG:NGN KE:KES GH:GHS ET:ETB TZ:TZS UG:UGX RW:RWF ZM:ZMW ZW:USD MW:MWK MZ:MZN AO:AOA NA:NAD
BW:BWP LS:LSL SZ:SZL MG:MGA MU:MUR SC:SCR SN:XOF CI:XOF ML:XOF BF:XOF NE:XOF TG:XOF BJ:XOF GW:XOF CM:XAF GA:XAF CG:XAF CF:XAF TD:XAF
GQ:XAF CD:CDF BI:BIF ER:ERN SS:SSP GM:GMD GN:GNF SL:SLE LR:LRD CV:CVE ST:STN`.split(/\s+/).reduce((o, x) => { const [c, k] = x.split(':'); o[c] = k; return o; }, {});
export const currencyOf = (c) => MAP[c] || 'EUR';

let mem = null, memAt = 0;
async function rates(env) {
  if (mem && Date.now() - memAt < 600e3) return mem;
  const kept = await getSetting(env, 'fx', null);
  let r = kept && kept.rates;
  if (!kept || Date.now() - kept.at > 12 * 3600e3) {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/EUR'), j = await res.json();
      if (j && j.result === 'success' && j.rates && j.rates.EUR === 1) {
        r = j.rates;
        await env.DB.prepare('INSERT OR REPLACE INTO settings(k,v) VALUES(?,?)').bind('fx', JSON.stringify({ at: Date.now(), rates: r })).run();
      }
    } catch (e) { console.error('fx', e.message); }
  }
  mem = r || {}; memAt = Date.now();
  return mem;
}
// The currency to show this visitor: { code, rate } (euros → that currency), or null to show euros.
export async function visitorCurrency(env, cat) {
  const code = currencyOf(env.VISITOR || '');
  if (code === 'EUR') return null;
  const pinned = Number((cat.rates || {})[code]);
  const rate = pinned > 0 ? pinned : Number((await rates(env))[code]);
  return rate > 0 ? { code, rate } : null;
}
