/**
 * Typography used in theme
 * @param {JsonObject} theme theme customization object
 */

export default function themeTypography(theme) {
  return {
    fontFamily:
      theme?.customization?.fontFamily ||
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    h1: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      color: theme.heading
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '0em',
      color: theme.heading
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: theme.heading
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      color: theme.heading
    },
    h5: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: theme.heading
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: theme.heading
    },
    subtitle1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
      color: theme.textDark
    },
    subtitle2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      fontWeight: 500,
      color: theme.darkTextSecondary
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: theme.darkTextPrimary
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: theme.darkTextPrimary
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: theme.darkTextSecondary
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      color: theme.darkTextSecondary
    },
    button: {
      textTransform: 'none',
      fontWeight: 500
    },
    customInput: {
      marginTop: 1,
      marginBottom: 1,
      '& > label': {
        top: 23,
        left: 0,
        color: theme.grey500,
        '&[data-shrink="false"]': {
          top: 5
        }
      },
      '& > div > input': {
        padding: '30.5px 14px 11.5px !important'
      },
      '& legend': {
        display: 'none'
      },
      '& fieldset': {
        top: 0
      }
    },
    otherInput: {
      marginTop: 1,
      marginBottom: 1
    },
    mainContent: {
      backgroundColor: theme.background,
      width: '100%',
      minHeight: 'calc(100vh - 88px)',
      flexGrow: 1,
      padding: '16px',
      paddingBottom: '30px',
      marginTop: '88px',
      marginRight: '0',
      marginBottom: '20px',
      borderRadius: '0'
    },
    menuCaption: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: theme.heading,
      padding: '6px',
      textTransform: 'capitalize',
      marginTop: '8px'
    },
    subMenuCaption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      color: theme.darkTextSecondary,
      textTransform: 'capitalize'
    },
    commonAvatar: {
      cursor: 'pointer',
      borderRadius: '4px'
    },
    smallAvatar: {
      width: '24px',
      height: '24px',
      fontSize: '0.875rem'
    },
    mediumAvatar: {
      width: '40px',
      height: '40px',
      fontSize: '1.2rem'
    },
    largeAvatar: {
      width: '40px',
      height: '40px',
      fontSize: '1.25rem'
    },
    menuButton: {
      color: theme.menuButtonColor,
      background: theme.menuButton
    },
    menuChip: {
      background: theme.menuChip
    },
    CardWrapper: {
      backgroundColor: theme.mode === 'dark' ? theme.colors.darkLevel2 : theme.colors.primaryDark
    },
    SubCard: {
      border: theme.mode === 'dark' ? '1px solid rgba(227, 232, 239, 0.2)' : '1px solid rgb(227, 232, 239)'
    },
    LoginButton: {
      color: theme.darkTextPrimary,
      backgroundColor: theme.mode === 'dark' ? theme.backgroundDefault : theme.colors?.grey50,
      borderColor: theme.mode === 'dark' ? theme.colors?.grey700 : theme.colors?.grey100
    }
  };
}
