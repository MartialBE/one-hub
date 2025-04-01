/**
 * Color intention that you want to used in your theme
 * @param {JsonObject} theme Theme customization object
 */

import { createGradient } from './utils';

export default function themePalette(theme) {
  return {
    mode: theme.mode,
    common: {
      black: theme.colors?.darkPaper
    },
    primary: {
      lighter: theme.mode === 'dark' ? '#60B8FF' : '#F0F7FF',
      light: theme.colors?.primaryLight,
      main: theme.colors?.primaryMain,
      dark: theme.colors?.primaryDark,
      200: theme.colors?.primary200,
      800: theme.colors?.primary800,
      contrastText: '#fff',
      gradient: createGradient(theme.colors?.primaryMain, theme.colors?.primaryDark)
    },
    secondary: {
      lighter: theme.mode === 'dark' ? '#B4A1FF' : '#F6F0FF',
      light: theme.colors?.secondaryLight,
      main: theme.colors?.secondaryMain,
      dark: theme.colors?.secondaryDark,
      200: theme.colors?.secondary200,
      800: theme.colors?.secondary800,
      contrastText: '#fff',
      gradient: createGradient(theme.colors?.secondaryMain, theme.colors?.secondaryDark)
    },
    error: {
      lighter: '#FFEBEE',
      light: theme.colors?.errorLight,
      main: theme.colors?.errorMain,
      dark: theme.colors?.errorDark,
      contrastText: '#fff',
      gradient: createGradient(theme.colors?.errorMain, theme.colors?.errorDark)
    },
    orange: {
      lighter: '#FFF3E0',
      light: theme.colors?.orangeLight,
      main: theme.colors?.orangeMain,
      dark: theme.colors?.orangeDark,
      contrastText: theme.mode === 'dark' ? '#fff' : '#000'
    },
    warning: {
      lighter: '#FFF8E1',
      light: theme.colors?.warningLight,
      main: theme.colors?.warningMain,
      dark: theme.colors?.warningDark,
      contrastText: theme.mode === 'dark' ? '#000' : '#000',
      gradient: createGradient(theme.colors?.warningMain, theme.colors?.warningDark)
    },
    success: {
      lighter: '#E6F8F1',
      light: theme.colors?.successLight,
      200: theme.colors?.success200,
      main: theme.colors?.successMain,
      dark: theme.colors?.successDark,
      contrastText: '#fff',
      gradient: createGradient(theme.colors?.successMain, theme.colors?.successDark)
    },
    grey: {
      50: theme.colors?.grey50,
      100: theme.colors?.grey100,
      200: theme.colors?.grey200,
      300: theme.colors?.grey300,
      500: theme.darkTextSecondary,
      600: theme.heading,
      700: theme.darkTextPrimary,
      900: theme.textDark
    },
    dark: {
      light: theme.colors?.darkTextPrimary,
      main: theme.colors?.darkLevel1,
      dark: theme.colors?.darkLevel2,
      800: theme.colors?.darkBackground,
      900: theme.colors?.darkPaper
    },
    text: {
      primary: theme.darkTextPrimary,
      secondary: theme.darkTextSecondary,
      dark: theme.textDark,
      hint: theme.colors?.grey100,
      disabled: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.38)'
    },
    divider: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)',
    background: {
      paper: theme.paper,
      default: theme.backgroundDefault
    },
    action: {
      hover: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
      selected: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.06)',
      disabled: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
      disabledBackground: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      focus: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)'
    }
  };
}
