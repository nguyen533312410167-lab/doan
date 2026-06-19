export const themeTokens = {
  primary: "#22C55E",
  secondary: "#15803D",
  success: "#4ADE80",
  background: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  text: "#FFFFFF",
  subText: "#94A3B8",
  expense: "#EF4444",
  income: "#22C55E",
  radius: 24,
  cardRadius: 20,
  shadow: "0 0 20px rgba(34,197,94,0.15)",
};

export const antdTheme = {
  token: {
    colorPrimary: themeTokens.primary,
    colorSuccess: themeTokens.success,
    colorError: themeTokens.expense,
    colorBgBase: themeTokens.background,
    colorBgContainer: themeTokens.card,
    colorBorder: themeTokens.border,
    colorText: themeTokens.text,
    colorTextSecondary: themeTokens.subText,
    borderRadius: themeTokens.radius,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: themeTokens.cardRadius,
      colorBgContainer: themeTokens.card,
    },
    Layout: {
      bodyBg: themeTokens.background,
      headerBg: themeTokens.background,
      siderBg: "#020617",
    },
    Menu: {
      darkItemBg: "#020617",
      darkItemSelectedBg: "rgba(34,197,94,0.16)",
      darkItemSelectedColor: themeTokens.primary,
    },
  },
};
