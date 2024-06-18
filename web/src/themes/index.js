import { createTheme } from '@mui/material/styles';

// assets
import colors from 'assets/scss/_themes-vars.module.scss';

// project imports
import componentStyleOverrides from './compStyleOverride';
import themePalette from './palette';
import themeTypography from './typography';
import { varAlpha } from './utils';

/**
 * Represent theme style and structure as per Material-UI
 * @param {JsonObject} customization customization parameter object
 */

export const theme = (customization) => {
  const color = colors;
  const options = customization.theme === 'light' ? GetLightOption() : GetDarkOption();
  const themeOption = {
    colors: color,
    ...options,
    customization
  };

  const themeOptions = {
    direction: 'ltr',
    palette: themePalette(themeOption),
    mixins: {
      toolbar: {
        minHeight: '48px',
        padding: '16px',
        '@media (min-width: 600px)': {
          minHeight: '48px'
        }
      }
    },
    typography: themeTypography(themeOption)
  };

  const themes = createTheme(themeOptions);
  themes.components = componentStyleOverrides(themeOption);

  return themes;
};

export default theme;

function GetDarkOption() {
  const color = colors;
  return {
    mode: 'dark',
    heading: color.darkTextTitle,
    paper: color.darkLevel2,
    backgroundDefault: color.darkPaper,
    background: color.darkBackground,
    darkTextPrimary: color.darkTextDark,
    darkTextSecondary: color.darkPrimaryLight,
    textDark: color.darkTextTitle,
    menuSelected: color.primary200,
    menuSelectedBack: varAlpha(color.primaryMain, 0.16),
    divider: color.darkDivider,
    borderColor: color.darkBorderColor,
    menuButton: color.darkLevel1,
    menuButtonColor: color.primaryMain,
    menuChip: color.darkLevel1,
    headBackgroundColor: color.darkTableHeader,
    headBackgroundColorHover: varAlpha(color.darkTableHeader, 0.4),
    tableBorderBottom: color.darkDivider
  };
}

function GetLightOption() {
  const color = colors;
  return {
    mode: 'light',
    heading: color.grey900,
    paper: color.paper,
    backgroundDefault: color.paper,
    background: color.primaryLight,
    darkTextPrimary: color.grey700,
    darkTextSecondary: color.grey500,
    textDark: color.grey900,
    menuSelected: color.primaryMain,
    menuSelectedBack: varAlpha(color.primary200, 0.08),
    divider: color.grey200,
    borderColor: color.grey300,
    menuButton: varAlpha(color.primary200, 0.2),
    menuButtonColor: color.primaryMain,
    menuChip: color.primaryLight,
    headBackgroundColor: color.tableBackground,
    headBackgroundColorHover: varAlpha(color.darkTableHeader, 0.08),
    tableBorderBottom: color.tableBorderBottom
  };
}
