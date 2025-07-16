export default function componentStyleOverrides(theme) {
  const bgColor = theme.mode === 'dark' ? theme.paper : theme.colors?.grey50;
  return {
    MuiCssBaseline: {
      styleOverrides: `
        * {
          box-sizing: border-box;
        }
        html, body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .apexcharts-title-text {
          fill: ${theme.textDark} !important
        }
        .apexcharts-text {
          fill: ${theme.textDark} !important
        }
        .apexcharts-legend-text {
          color: ${theme.textDark} !important
        }
        .apexcharts-menu {
          background: ${theme.backgroundDefault} !important
        }
        .apexcharts-gridline, .apexcharts-xaxistooltip-background, .apexcharts-yaxistooltip-background {
          stroke: ${theme.divider} !important;
        }
      `
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: '10px',
          textTransform: 'none',
          boxShadow: 'none',
          minHeight: '36px',
          padding: '6px 16px',
          letterSpacing: '0.01em',
          transition: 'background-color 0.2s ease-in-out',
          '&.Mui-disabled': {
            color: theme.colors?.grey600
          },
          '&:hover': {
            boxShadow: 'none'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        containedPrimary: {
          background: theme.colors?.primaryMain,
          '&:hover': {
            background: theme.colors?.primaryDark
          }
        },
        outlinedPrimary: {
          borderColor: theme.colors?.primaryMain,
          color: theme.colors?.primaryMain,
          '&:hover': {
            backgroundColor: 'rgba(8, 132, 221, 0.04)'
          }
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
          minHeight: '32px',
          borderRadius: '8px'
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '1rem',
          minHeight: '48px'
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px',
          color: theme.darkTextPrimary,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        },
        sizeSmall: {
          padding: '4px'
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '14px',
          boxShadow: theme.mode === 'dark' ? '0 2px 8px 0 rgba(0,0,0,0.2)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)'
        },
        rounded: {
          borderRadius: `${theme?.customization?.borderRadius || 14}px`
        },
        elevation1: {
          boxShadow: theme.mode === 'dark' ? '0 2px 8px 0 rgba(0,0,0,0.2)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)'
        },
        elevation2: {
          boxShadow:
            theme.mode === 'dark' ? '0 3px 12px 0 rgba(0,0,0,0.22)' : '0 3px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          padding: 0,
          boxShadow: theme.mode === 'dark' ? '0 2px 8px 0 rgba(0,0,0,0.2)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            boxShadow:
              theme.mode === 'dark' ? '0 6px 16px 0 rgba(0,0,0,0.3)' : '0 8px 14px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
          },
          '& .MuiTableContainer-root': {
            borderRadius: 0
          }
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          color: theme.colors?.textDark,
          padding: '24px'
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600
        },
        subheader: {
          fontSize: '0.875rem',
          color: theme.darkTextSecondary,
          marginTop: '4px'
        },
        avatar: {
          marginRight: '16px'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px'
          },
          '& .MuiTableContainer-root': {
            margin: '-24px',
            width: 'calc(100% + 48px)',
            maxWidth: 'calc(100% + 48px)'
          }
        }
      }
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 20px'
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        popper: {
          boxShadow: theme.mode === 'dark' ? '0 4px 20px 0 rgba(0,0,0,0.3)' : '0 2px 10px 0 rgba(0,0,0,0.12)',
          borderRadius: '8px',
          color: theme.darkTextPrimary
        },
        listbox: {
          padding: '4px 0'
        },
        option: {
          fontSize: '0.875rem',
          fontWeight: 400,
          lineHeight: '1.43',
          padding: '8px 16px',
          '&:hover': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
          },
          '&[aria-selected="true"]': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)'
          }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.darkTextPrimary,
          borderRadius: '8px',
          padding: '8px 16px',
          '&.Mui-selected': {
            color: theme.menuSelected,
            backgroundColor: theme.menuSelectedBack,
            '&:hover': {
              backgroundColor: theme.menuSelectedBack
            },
            '& .MuiListItemIcon-root': {
              color: theme.menuSelected
            }
          },
          '&:hover': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
            color: theme.menuSelected,
            '& .MuiListItemIcon-root': {
              color: theme.menuSelected
            }
          }
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.darkTextPrimary,
          minWidth: '36px'
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: theme.textDark,
          fontSize: '0.875rem'
        },
        secondary: {
          fontSize: '0.75rem',
          color: theme.darkTextSecondary
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          lineHeight: '1.5'
        },
        input: {
          color: theme.textDark,
          '&::placeholder': {
            color: theme.darkTextSecondary,
            fontSize: '0.875rem'
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: bgColor,
          borderRadius: '12px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : theme.colors?.grey300,
            borderWidth: '1px',
            transition: 'border-color 0.2s ease-in-out'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.colors?.primaryMain,
            borderWidth: '1px'
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.colors?.primaryMain,
              borderWidth: '1.5px'
            }
          },
          '&.Mui-error': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.colors?.errorMain
            }
          },
          '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0
          },
          '& input[type=number]': {
            MozAppearance: 'textfield'
          }
        },
        input: {
          padding: '14px 16px',
          height: 'auto',
          fontSize: '0.9375rem'
        },
        inputMultiline: {
          padding: '4px 8px'
        },
        sizeSmall: {
          '& input': {
            padding: '10px 14px'
          }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          color: theme.darkTextSecondary,
          transform: 'translate(16px, 16px) scale(1)',
          '&.Mui-focused': {
            color: theme.colors?.primaryMain
          },
          '&.Mui-error': {
            color: theme.colors?.errorMain
          },
          '&.MuiInputLabel-shrink': {
            transform: 'translate(16px, -9px) scale(0.75)'
          }
        }
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          marginLeft: '4px',
          marginTop: '4px'
        }
      }
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          width: 'auto',
          '& .MuiIconButton-root': {
            padding: 0,
            width: '20px',
            height: '20px',
            minWidth: '20px',
            margin: 0
          },
          '& .MuiSvgIcon-root, & .iconify': {
            fontSize: '16px',
            width: '16px',
            height: '16px'
          }
        },
        positionEnd: {
          marginLeft: 0,
          paddingLeft: 0
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 4,
          '&.Mui-disabled': {
            color: theme.colors?.grey300
          }
        },
        mark: {
          backgroundColor: theme.paper,
          width: '4px'
        },
        valueLabel: {
          color: theme?.colors?.primaryLight
        },
        thumb: {
          width: 14,
          height: 14
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.divider,
          opacity: 0.6
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          color: theme.colors?.primaryDark,
          background: theme.colors?.primary200,
          fontSize: '1rem',
          fontWeight: 500
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          height: '32px',
          borderRadius: '16px',
          backgroundColor: theme.mode === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.8)',
          color: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
          transition: 'all 0.2s ease-in-out',
          '&.MuiChip-outlined': {
            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backgroundColor: 'transparent',
            color: theme.textDark
          },
          '&.MuiChip-clickable': {
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#000000'
            }
          }
        },
        label: {
          padding: '0 12px',
          lineHeight: '32px'
        },
        icon: {
          fontSize: '1.25rem',
          marginLeft: '8px',
          marginRight: '-6px',
          color: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff'
        },
        deleteIcon: {
          fontSize: '1.25rem',
          color: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          margin: '0 5px 0 -6px',
          padding: '2px',
          '&:hover': {
            color: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
            backgroundColor: 'transparent'
          }
        },
        sizeSmall: {
          height: '26px',
          fontSize: '0.75rem',
          '& .MuiChip-label': {
            padding: '0 10px',
            lineHeight: '26px'
          },
          '& .MuiChip-icon': {
            fontSize: '1rem'
          },
          '& .MuiChip-deleteIcon': {
            fontSize: '1rem'
          }
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          overflowY: 'auto',
          borderRadius: '12px',
          boxShadow: 'none',
          ...(theme.breakpoints && {
            [theme.breakpoints.down('sm')]: {
              maxWidth: '100%',
              whiteSpace: 'nowrap'
            }
          })
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
          width: '100%',
          margin: 0,
          padding: 0
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: theme.headBackgroundColor,
          borderBottom: `1px dashed ${theme.tableBorderBottom}`,
          width: '100%',
          margin: 0,
          '& tr': {
            width: '100%',
            '& th:first-of-type': {
              borderTopLeftRadius: 0,
            },
            '& th:last-of-type': {
              borderTopRightRadius: 0,
            }
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px dashed ${theme.tableBorderBottom}`,
          fontSize: '0.875rem',
          padding: '16px 12px',
          textAlign: 'center',
          '&:first-of-type': {
            paddingLeft: '12px'
          },
          '&:last-of-type': {
            paddingRight: '12px'
          }
        },
        head: {
          fontSize: '0.875rem',
          fontWeight: 600,
          color: theme.darkTextSecondary,
          borderBottom: 'none',
          whiteSpace: 'nowrap',
          padding: '14px 12px',
          textAlign: 'center'
        },
        body: {
          color: theme.textDark
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.04)'
          },
          '&:last-child td': {
            borderBottom: 0
          },
          '&.MuiTableRow-root.MuiTableRow-hover:hover': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.04)'
          },
          '& .MuiCollapse-root': {
            '&:hover': {
              backgroundColor: 'transparent'
            }
          },
          '& .MuiCollapse-root .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: theme.textDark,
          borderTop: `1px dashed ${theme.tableBorderBottom}`,
          overflow: 'auto',
          backgroundColor: theme.headBackgroundColor,
          minHeight: '56px',
          width: '100%',
          margin: 0,
          padding: '0 24px',
          '& .MuiToolbar-root': {
            minHeight: '56px',
            padding: '0',
            ...(theme.breakpoints && {
              [theme.breakpoints.down('sm')]: {
                flexWrap: 'wrap',
                justifyContent: 'center',
                padding: '8px 0'
              }
            }),
            '& > p:first-of-type': {
              fontSize: '0.875rem',
              color: theme.darkTextSecondary
            }
          }
        },
        select: {
          paddingTop: '6px',
          paddingBottom: '6px',
          paddingLeft: '12px',
          paddingRight: '28px',
          borderRadius: '8px',
          backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          '&:focus': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.05)'
          }
        },
        selectLabel: {
          paddingLeft: '20px'
        },
        selectIcon: {
          color: theme.darkTextSecondary,
          right: '6px'
        },
        actions: {
          padding: '0 30px',
          marginLeft: '16px',
          ...(theme.breakpoints && {
            [theme.breakpoints.down('sm')]: {
              marginLeft: '0',
              marginTop: '8px'
            }
          }),
          '& .MuiIconButton-root': {
            padding: '8px',
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '8px',
            color: theme.darkTextSecondary,
            margin: '0 4px',
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.05)'
            },
            '&.Mui-disabled': {
              color: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
              backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
            }
          }
        },
        displayedRows: {
          fontSize: '0.875rem',
          color: theme.darkTextSecondary,
          margin: 0,
          ...(theme.breakpoints && {
            [theme.breakpoints.down('sm')]: {
              margin: '8px 0'
            }
          })
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: theme.colors.paper,
          background: theme.mode === 'dark' ? theme.colors?.grey700 : '#212121',
          borderRadius: '6px',
          fontWeight: 400,
          fontSize: '0.75rem',
          padding: '6px 10px',
          boxShadow: theme.mode === 'dark' ? '0 2px 8px 0 rgba(0,0,0,0.3)' : '0 1px 4px 0 rgba(0,0,0,0.15)'
        },
        arrow: {
          color: theme.mode === 'dark' ? theme.colors?.grey700 : '#212121'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: '8px',
          alignItems: 'center',
          padding: '12px 16px'
        },
        icon: {
          fontSize: '20px',
          opacity: 1
        },
        standardSuccess: {
          backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.16)' : theme.colors?.successLight,
          color: theme.mode === 'dark' ? '#E0F2E9' : theme.colors?.successDark,
          '& .MuiAlert-icon': {
            color: theme.mode === 'dark' ? '#34D399' : theme.colors?.successMain
          }
        },
        standardError: {
          backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.16)' : theme.colors?.errorLight,
          color: theme.mode === 'dark' ? '#FEE2E2' : theme.colors?.errorDark,
          '& .MuiAlert-icon': {
            color: theme.mode === 'dark' ? '#F87171' : theme.colors?.errorMain
          }
        },
        standardWarning: {
          backgroundColor: theme.mode === 'dark' ? 'rgba(250, 173, 20, 0.16)' : theme.colors?.warningLight,
          color: theme.mode === 'dark' ? '#FEF3C7' : theme.colors?.warningDark,
          '& .MuiAlert-icon': {
            color: theme.mode === 'dark' ? '#FBBF24' : theme.colors?.warningMain
          }
        },
        standardInfo: {
          backgroundColor: theme.mode === 'dark' ? 'rgba(8, 132, 221, 0.16)' : 'rgba(8, 132, 221, 0.08)',
          color: theme.mode === 'dark' ? '#E0F1FF' : theme.colors?.primaryDark,
          '& .MuiAlert-icon': {
            color: theme.mode === 'dark' ? '#60B8FF' : theme.colors?.primaryMain
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.divider}`,
          minHeight: '40px'
        },
        indicator: {
          backgroundColor: theme.colors?.primaryMain,
          height: 2
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: '40px',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: theme.darkTextSecondary,
          '&.Mui-selected': {
            color: theme.colors?.primaryMain
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          boxShadow: theme.mode === 'dark' ? '0 12px 40px 0 rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'visible',
          '&.MuiPaper-rounded': {
            borderRadius: '16px'
          }
        },
        paperWidthXs: {
          maxWidth: '360px'
        },
        paperWidthSm: {
          maxWidth: '480px'
        },
        paperWidthMd: {
          maxWidth: '640px'
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '24px 24px 12px',
          color: theme.textDark
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '12px 24px 24px',
          fontSize: '0.9375rem',
          color: theme.darkTextPrimary
        }
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 24px',
          '& .MuiButton-root': {
            minWidth: '100px'
          }
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: theme.colors?.primaryMain,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }
      }
    },
    MuiBadge: {
      styleOverrides: {
        standard: {
          fontSize: '0.6875rem',
          fontWeight: 500,
          lineHeight: 1,
          minWidth: '18px',
          height: '18px',
          padding: '0 5px',
          borderRadius: '9px'
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center'
        },
        icon: {
          top: 'calc(50% - 12px)',
          right: '12px',
          color: theme.darkTextSecondary,
          transition: 'transform 0.2s ease-in-out',
          '.Mui-focused &': {
            transform: 'rotate(180deg)'
          }
        },
        iconOpen: {
          transform: 'rotate(180deg)'
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          padding: '10px 16px',
          minHeight: '42px',
          '&.Mui-selected': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(8, 132, 221, 0.15)' : 'rgba(8, 132, 221, 0.08)',
            '&.Mui-focusVisible': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(8, 132, 221, 0.25)' : 'rgba(8, 132, 221, 0.12)'
            }
          }
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 0,
          backgroundColor: theme.mode === 'dark' ? theme.paper : theme.colors?.paper,
          overflow: 'hidden',
          width: '100%',
          margin: 0,
          padding: 0,
          '& .MuiPaper-root': {
            borderRadius: 0
          },
          '&.MuiPaper-root': {
            borderRadius: 0
          },
          '& .MuiDataGrid-main': {
            width: '100%',
            margin: 0,
            padding: 0,
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: `1px dashed ${theme.tableBorderBottom}`,
              borderRadius: 0,
              backgroundColor: theme.headBackgroundColor,
              minHeight: '48px',
              width: '100%',
              margin: 0
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: theme.mode === 'dark' ? theme.paper : '#fff',
              width: '100%',
              margin: 0
            },
            '& .MuiDataGrid-columnHeadersInner': {
              width: '100%',
              margin: 0,
              padding: 0,
              '& .MuiDataGrid-columnHeader': {
                padding: 0,
                margin: 0,
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  justifyContent: 'center',
                  padding: '0 16px',
                  margin: 0
                },
                '&:first-of-type': {
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    paddingLeft: '24px'
                  }
                },
                '&:last-of-type': {
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    paddingRight: '24px'
                  }
                }
              }
            },
            '& .MuiDataGrid-cellContent': {
              justifyContent: 'center',
              width: '100%',
              display: 'flex'
            }
          },
          footerContainer: {
            borderTop: `1px dashed ${theme.tableBorderBottom}`,
            minHeight: '56px',
            backgroundColor: theme.headBackgroundColor,
            width: '100%',
            margin: 0,
            padding: '0 24px',
            '& .MuiTablePagination-root': {
              overflow: 'visible',
              backgroundColor: 'transparent',
              color: theme.textDark,
              borderTop: 'none'
            },
            '& .MuiToolbar-root': {
              minHeight: '56px',
              padding: '0',
              '& > p:first-of-type': {
                fontSize: '0.875rem',
                color: theme.darkTextSecondary
              }
            }
          }
        },
        columnHeader: {
          padding: '12px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: theme.darkTextSecondary,
          height: '48px',
          textAlign: 'center',
          '&:focus': {
            outline: 'none'
          },
          '&:focus-within': {
            outline: 'none'
          }
        },
        columnHeaderTitle: {
          color: theme.darkTextSecondary,
          fontWeight: 600,
          fontSize: '0.875rem',
          textAlign: 'center'
        },
        columnSeparator: {
          color: theme.divider
        },
        cell: {
          fontSize: '0.875rem',
          padding: '12px 16px',
          borderBottom: `1px dashed ${theme.tableBorderBottom}`,
          textAlign: 'center',
          '&:focus': {
            outline: 'none'
          },
          '&:focus-within': {
            outline: 'none'
          }
        },
        row: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.04)'
          },
          '&.Mui-selected': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(8, 132, 221, 0.15)' : 'rgba(8, 132, 221, 0.08)',
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(8, 132, 221, 0.25)' : 'rgba(8, 132, 221, 0.12)'
            }
          }
        },
        rowCount: {
          color: theme.darkTextSecondary
        },
        selectedRowCount: {
          color: theme.colors?.primaryMain,
          fontWeight: 500
        },
        toolbarContainer: {
          backgroundColor: theme.mode === 'dark' ? theme.paper : theme.colors?.paper,
          padding: '12px 16px',
          '& .MuiButton-root': {
            marginRight: '8px'
          }
        },
        panelHeader: {
          backgroundColor: theme.mode === 'dark' ? theme.paper : theme.colors?.paper,
          padding: '16px 20px',
          borderBottom: `1px dashed ${theme.divider}`
        },
        panelContent: {
          padding: '16px 20px'
        }
      }
    },
    MuiGridFilterForm: {
      styleOverrides: {
        root: {
          padding: '16px 20px'
        }
      }
    },
    MuiDataGridPanel: {
      styleOverrides: {
        root: {
          backgroundColor: theme.mode === 'dark' ? theme.paper : '#fff',
          boxShadow: theme.mode === 'dark' ? '0 8px 24px 0 rgba(0,0,0,0.4)' : '0 8px 24px -4px rgba(0,0,0,0.15)',
          borderRadius: '14px'
        }
      }
    },
    MuiDataGridColumnHeaderFilterIconButton: {
      styleOverrides: {
        root: {
          color: theme.darkTextSecondary,
          '&:hover': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
          }
        }
      }
    },
    MuiDataGridPanelFooter: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          borderTop: `1px dashed ${theme.divider}`
        }
      }
    },
    MuiDataGridMenuList: {
      styleOverrides: {
        root: {
          backgroundColor: theme.mode === 'dark' ? theme.paper : '#fff',
          padding: '8px 0'
        }
      }
    },
    MuiDataGridMenu: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            boxShadow: theme.mode === 'dark' ? '0 8px 24px 0 rgba(0,0,0,0.4)' : '0 8px 24px -4px rgba(0,0,0,0.15)',
            borderRadius: '12px'
          }
        }
      }
    }
  };
}
