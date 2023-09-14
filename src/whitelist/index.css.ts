import { Styles } from '@ijstech/components';
const Theme = Styles.Theme.ThemeVars;

export const whiteListStyle = Styles.style({
  $nest: {
    '.modal': {
      background: Theme.background.modal,
      width: 700,
      maxWidth: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '1rem',
      color: Theme.text.primary
    },
    '.i-modal_header': {
      marginBottom: '0.75rem',
      paddingBottom: '0.5rem',
      borderBottom: `2px soid ${Theme.background.main}`,
      color: Theme.colors.primary.main,
      fontSize: '1.25rem',
      fontWeight: 700,
      $nest: {
        '&> span': {
          color: Theme.colors.primary.main,
        },
        '&> i-icon': {
          fill: `${Theme.colors.primary.main} !important`
        },
        '& ~ i-icon': {
          display: 'inline-block',
          margin: '0.75rem 0',
          background: Theme.input.background,
          border: '2px solid transparent',
          borderRadius: '50%',
          padding: '0.25rem'
        }
      }
    },
    '.text-yellow *': {
      color: Theme.colors.secondary.main,
    },
    '.text-err': {
      marginBottom: '0.25rem',
      lineHeight: '1rem',
      $nest: {
        '*': {
          color: Theme.colors.primary.main,
        }
      }
    },
    '.text-note *': {
      color: '#b5b8e3',
      fontSize: '0.8rem',
      lineHeight: '1rem',
      display: 'block',
    },
    '.search-box': {
      width: 'calc(100% - 6px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'hsla(0, 0%, 100%, 0.1)',
      borderRadius: '8px',
      marginBottom: '8px',
      marginLeft: '2px',
    },
    '.input-search': {
      maxWidth: 'calc(100% - 32px)',
      $nest: {
        'input': {
          color: Theme.input.fontColor,
          background: 'transparent',
          borderRadius: '8px',
          border: 'none',
          padding: '0.5rem',
          $nest: {
            '&::placeholder': {
              color: Theme.text.primary,
              opacity: 0.8,
            },
            '&:focus::placeholder': {
              opacity: 0,
            },
          },
        },
      },
    },
    '.input-address': {
      opacity: 1,
      $nest: {
        'input': {
          padding: '0.5rem',
          color: Theme.input.fontColor,
          background: Theme.input.background,
          borderRadius: '10px',
          border: '1px solid transparent'
        },
      },
    },
    '.input-allocation': {
      opacity: 1,
      display: 'flex',
      flexDirection: 'row-reverse',
      alignItems: 'center',
      background: Theme.input.background,
      borderRadius: '10px',
      border: '1px solid transparent',
      paddingInline: '0.35rem',
      $nest: {
        '&.w-input': {
          maxWidth: 'calc(100% - 28px)'
        },
        'span': {
          overflow: 'unset',
          fontSize: '14px',
          marginBottom: '2.5px',
          paddingRight: '0.25rem',
        },
        'label': {
          width: 'auto !important',
        },
        'input': {
          background: 'transparent',
          border: 'none',
          color: Theme.input.fontColor,
          borderRadius: 0,
        }
      },
    },
    '.input-batch': {
      maxWidth: '500px',
      $nest: {
        'textarea': {
          background: Theme.input.background,
          color: Theme.input.fontColor,
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: 'none',
          height: '150px !important',
          resize: 'none',
        },
        '::-webkit-scrollbar': {
          width: '3px',
        },
        '::-webkit-scrollbar-thumb': {
          background: Theme.background.gradient,
          borderRadius: '5px',
        },
      }
    },
    '#groupBtnElm': {
      marginRight: 'auto',
      $nest: {
        'i-icon': {
          width: '16px !important',
          height: '16px !important',
          marginRight: '0.25rem',
        },
      },
    },
    'i-button': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '150px',
      paddingBlock: '0.35rem',
      fontWeight: 600,
      borderRadius: 5,
      margin: '0.5rem',
    },
    '.btn-cancel': {
      background: '#eaecef !important',
      color: `${Theme.background.default} !important`,
    },
    '.btn-submit': {
      textAlign: 'center',
    },
    'i-icon': {
      display: 'flex !important',
    },
    'i-pagination': {
      marginBottom: '1.5rem',
      $nest: {
        '.paginate_button': {
          backgroundColor: 'rgb(12, 18, 52)',
          border: `1px solid #f15e61`,
          color: '#f7d064',
          padding: '4px 16px',
          $nest: {
            '&.active': {
              backgroundColor: '#d05271',
              border: '1px solid #d05271',
              color: '#fff',
            },
          },
        },
      },
    },
    '@media screen and (max-width: 525px)': {
      $nest: {
        '.total-info': {
          flexDirection: 'column',
          alignItems: 'flex-start',
        },
        '.text-note *': {
          fontSize: '0.75rem',
        },
        'i-pagination': {
          marginBottom: '1.5rem',
          $nest: {
            '#nextMoreElm': {
              display: 'none',
            },
            '.paginate_button': {
              $nest: {
                '&.previous, &.next': {
                  display: 'none',
                },
              },
            },
            '.pagination-main': {
              flexWrap: 'wrap',
              $nest: {
                '.paginate_button': {
                  minWidth: '50px',
                },
              },
            },
          },
        },
      },
    },
  },
})
