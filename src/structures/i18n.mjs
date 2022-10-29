import { Locale } from "discord.js";
import i18n from "i18n";
/* // valid localizations for discord.com
  EnglishUS     <-> en-US
  EnglishGB     <-> en-GB
  Bulgarian     <-> bg
  ChineseCN     <-> zh-CN
  ChineseTW     <-> zh-TW
  Croatian      <-> hr
  Czech         <-> cs
  Danish        <-> da
  Dutch         <-> nl
  Finnish       <-> fi
  French        <-> fr
  German        <-> de
  Greek         <-> el
  Hindi         <-> hi
  Hungarian     <-> hu
  Italian       <-> it
  Japanese      <-> ja
  Korean        <-> ko
  Lithuanian    <-> lt
  Norwegian     <-> no
  Polish        <-> pl
  PortugueseBR  <-> pt-BR
  Romanian      <-> ro
  Russian       <-> ru
  SpanishES     <-> es-ES
  Swedish       <-> sv-SE
  Thai          <-> th
  Turkish       <-> tr
  Ukrainian     <-> uk
  Vietnamese    <-> vi
*/
export function init() {
    i18n.configure({
        locales: [
            "EnglishUS",
            "EnglishGB",
            "German",
        ],
        defaultLocale: "EnglishUS",
        directory: `${process.cwd()}/src/data/locales`,
        retryInDefaultLocale: true,
        objectNotation: true,
        register: global,
        logWarnFn: function (msg) {
          console.warn(msg);
        },
        logErrorFn: function (msg) {
          console.error(msg);
        },
        missingKeyFn: function (locale, value) {
          return value;
        },
        mustacheConfig: {
          tags: ["{{", "}}"],
          disable: false
        }
    });
}

// i18n.setLocale(config.LOCALE);

export { i18n };

export function inlineLocalization(locale, name, desc) {
    return { 
        name: [locale, name], 
        description: [locale, inlineLocale(locale, desc)]
     }
}
export function inlineLocale(locale, text, ...params) {
    i18n.setLocale(locale)
    return i18n.__(text,  ...params);
}

export function inlineChoicesLocale(text) {
  const o = {};
  i18n.getLocales().forEach(locale => {
    o[Locale[locale] || locale] = inlineLocale(locale, text);
  })
  return o;
}
export function inlineDescriptionLocalization(name, text) {
  return i18n.getLocales().map(locale => inlineLocalization(Locale[locale] || locale, name, text))
}