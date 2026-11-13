/**
 * Sets `colorAccent` on the Android app theme so native dialogs (the date
 * picker) use the brand colour instead of AppCompat's default teal. A night
 * variant keeps enough contrast in dark mode while the theme stays DayNight.
 *
 * Usage in app.json: ["./plugins/withAndroidAccentColor", { "light": "#AD404A", "dark": "#FFB3B6" }]
 */
const {
  AndroidConfig,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} = require("expo/config-plugins");

const COLOR_NAME = "colorAccent";

module.exports = function withAndroidAccentColor(config, { light, dark } = {}) {
  if (!light) throw new Error("withAndroidAccentColor: a `light` colour is required.");

  config = withAndroidColors(config, (c) => {
    c.modResults = AndroidConfig.Colors.assignColorValue(c.modResults, { name: COLOR_NAME, value: light });
    return c;
  });

  config = withAndroidColorsNight(config, (c) => {
    c.modResults = AndroidConfig.Colors.assignColorValue(c.modResults, {
      name: COLOR_NAME,
      value: dark ?? null,
    });
    return c;
  });

  return withAndroidStyles(config, (c) => {
    c.modResults = AndroidConfig.Styles.assignStylesValue(c.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: COLOR_NAME,
      value: `@color/${COLOR_NAME}`,
    });
    return c;
  });
};
