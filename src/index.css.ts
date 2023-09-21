import { Styles } from '@ijstech/components';
import assets from './assets';
const Theme = Styles.Theme.ThemeVars;

const colorVar = {
  primaryButton: 'transparent linear-gradient(90deg, #AC1D78 0%, #E04862 100%) 0% 0% no-repeat padding-box',
  primaryGradient: 'linear-gradient(255deg,#f15e61,#b52082)',
  primaryDisabled: 'transparent linear-gradient(270deg,#351f52,#552a42) 0% 0% no-repeat padding-box !important'
}

export const liquidityProviderContainer = Styles.style({
  $nest: {
    'dapp-container-body': {
      $nest: {
        '&::-webkit-scrollbar': {
          width: '6px',
          height: '6px'
        },
        '&::-webkit-scrollbar-track': {
          borderRadius: '10px',
          border: '1px solid transparent',
          background: `${Theme.divider} !important`
        },
        '&::-webkit-scrollbar-thumb': {
          background: `${Theme.colors.primary.main} !important`,
          borderRadius: '10px',
          outline: '1px solid transparent'
        }
      }
    }
  }
})

export const liquidityProviderComponent = Styles.style({
  padding: '1rem',
  $nest: {
    'span': {
      letterSpacing: '0.15px',
    },
    '.i-loading-overlay': {
      background: Theme.background.main,
    },
    '.btn-os': {
      background: colorVar.primaryButton,
      height: 'auto !important',
      color: '#fff',
      // color: Theme.colors.primary.contrastText,
      transition: 'background .3s ease',
      fontSize: '1rem',
      fontWeight: 'bold',
      $nest: {
        'i-icon.loading-icon': {
          marginInline: '0.25rem',
          width: '16px !important',
          height: '16px !important',
        },
        'svg': {
          // fill: `${Theme.colors.primary.contrastText} !important`
          fill: `#fff !important`
        }
      },
    },
    '.btn-os:not(.disabled):not(.is-spinning):hover, .btn-os:not(.disabled):not(.is-spinning):focus': {
      background: colorVar.primaryGradient,
      backgroundColor: 'transparent',
      boxShadow: 'none',
      opacity: .9
    },
    '.btn-os:not(.disabled):not(.is-spinning):focus': {
      boxShadow: '0 0 0 0.2rem rgb(0 123 255 / 25%)'
    },
    '.btn-os.disabled, .btn-os.is-spinning': {
      background: colorVar.primaryDisabled,
      opacity: 1
    },
    '.hidden': {
      display: 'none !important'
    },
    'i-modal .modal': {
      background: Theme.background.modal,
    },
    '#lockModal': {
      $nest: {
        '.modal': {
          width: 480,
          maxWidth: '100%',
          padding: '0.75rem 1rem',
          borderRadius: '1rem',
          color: Theme.text.primary
        },
        '.i-modal_header': {
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
          borderBottom: `2px solid ${Theme.input.background}`,
          color: Theme.colors.primary.main,
          fontSize: '1.25rem',
          fontWeight: 700,
        },
        '.i-modal_header > i-icon': {
          fill: `${Theme.colors.primary.main} !important`
        },
        '.i-modal_header ~ i-icon': {
          display: 'inline-block',
          margin: '0.75rem 0',
          border: '2px solid transparent',
          borderRadius: '50%',
          padding: '0.25rem'
        },
        'i-button': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '150px',
          height: '50px !important',
          fontWeight: 600,
          borderRadius: 5,
          margin: '0.5rem',
        },
        '.btn-cancel': {
          background: `${Theme.text.primary} !important`,
          color: `${Theme.background.main} !important`,
        },
        '.i-checkbox': {
          cursor: 'pointer',
        },
        'i-checkbox .checkmark': {
          backgroundColor: '#fff',
          height: '18px',
          width: '18px',
          $nest: {
            '&::after': {
              top: '2px',
              left: '6px',
              borderColor: '#fff',
            },
          },
        },
        'i-checkbox.is-checked .checkmark': {
          backgroundColor: Theme.colors.primary.main
        }
      }
    }
  }
})

export const liquidityProviderForm = Styles.style({
  maxWidth: 920,
  margin: '0 auto',
  $nest: {
    '.hidden': {
      display: 'none !important'
    },
    '.w-100': {
      width: '100%'
    },
    '.red-color i-label *': {
      color: '#f15e61'
    },
    '.green-color *': {
      color: '#77D394'
    },
    'i-icon': {
      display: 'inline-block'
    },
    'i-button i-icon.loading-icon': {
      display: 'inline-flex'
    },
    '.text--primary *': {
      color: Theme.colors.primary.main
    },
    '.back-section i-link a': {
      display: 'flex',
      alignItems: 'center'
    },
    '.custom-container': {
      width: 'calc(50% - 10px)',
      minWidth: 320,
      marginInline: 'auto'
    },
    '.detail-col': {
      font: `normal normal 700 1.5rem/1.5rem ${Theme.typography.fontFamily}`,
      background: 'hsla(0,0%,100%,0.10196078431372549)',
      borderRadius: '1em',
      border: `1px solid ${Theme.divider}`,
      padding: '0 1rem 1rem',
      marginBottom: '1.5rem',
      fontWeight: 'normal',
      $nest: {
        '.icon-right': {
          display: 'inline-block',
          marginRight: '1rem'
        },
        '.detail-col_header': {
          borderBottom: `2px solid ${Theme.divider}`,
          padding: '1rem 1rem 1rem 0'
        },
        '.detail-col_header i-label *': {
          fontWeight: 700,
          fontSize: '1.25rem'
        },
        '.detail-col_header i-label.small-label *': {
          fontSize: '0.9rem'
        },
        '.input--token-container': {
          padding: '0.5rem 0',
        },
        '.btn-max': {
          borderRadius: '0.5rem',
          marginLeft: '0.5rem',
          opacity: 0.8,
          color: '#fff',
          padding: '.2rem .5rem'
        },
        '.bg-box': {
          margin: '0.5rem 0'
        },
        '.input--token-box': {
          padding: '0.25rem 0.5rem',
          background: Theme.input.background,
          border: `2px solid ${Theme.input.background}`,
          borderRadius: '0.75rem',
          $nest: {
            '&.bordered': {
              border: `2px solid ${Theme.colors.primary.main}`
            },
            'i-button': {
              padding: '0.3rem 0.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1.5,
              alignSelf: 'center',
              textAlign: 'center',
              opacity: 1
            },
            '.text-value': {
              display: 'block',
              $nest: {
                '> *': {
                  fontSize: '1.25rem',
                  paddingRight: '0.25rem'
                }
              }
            },
            'i-input': {
              width: '100%',
              height: '100% !important'
            },
            'i-input > input': {
              width: '100%',
              height: '100% !important',
              padding: '.375rem .75rem',
              paddingRight: '0.25rem',
              paddingLeft: 0,
              borderRadius: '0.25rem',
              border: 'none',
              background: 'transparent',
              color: Theme.input.fontColor,
              fontSize: '1.25rem'
            },
            'i-icon svg': {
              verticalAlign: 'top'
            },
            '#gridTokenInput': {
              paddingInline: '0 !important',
              background: 'transparent !important'
            }
          }
        },
        '.custom-question-icon': {
          display: 'flex !important',
          marginTop: '4px',
        },
        '#datePanel': {
          $nest: {
            '.input--token-container': {
              width: 'auto',
              maxWidth: 'calc(50% - 5px)',
            },
            '.input--token-box': {
              padding: 0,
            },
          },
        },
        '.toggle-icon': {
          display: 'inline-block',
          padding: '3px',
          marginLeft: 'auto',
          border: '2px solid transparent',
          borderRadius: '50%',
          transform: 'rotate(90deg)',
          cursor: 'pointer'
        },
        '.custom-datepicker': {
          $nest: {
            'input[type="text"]': {
              background: 'transparent',
              height: '60px !important',
              width: '100% !important',
              border: 'none',
              padding: '1rem 0.75rem',
              fontSize: '1.25rem',
              color: Theme.input.fontColor,
              $nest: {
                '&::placeholder': {
                  color: Theme.input.fontColor,
                  opacity: 0.8
                },
              }
            },
            '.datepicker-toggle': {
              display: 'flex',
              width: '100% !important',
              height: '100% !important',
              padding: 0,
              position: 'absolute',
              top: 0,
              margin: 0,
              background: 'transparent',
              border: 'none'
            },
            'i-icon': {
              width: '100%',
            },
            'svg': {
              display: 'none',
            }
          },
        },
        '.input--token-container.disabled *, .token-box.disabled *': {
          cursor: 'default !important',
        },
        '.btn-address': {
          padding: '0.25rem .75rem',
        },
        '.btn-next': {
          width: '100%',
          padding: '.75rem',
          marginTop: 10,
          marginBottom: 25,
          textAlign: 'center',
        },
        '.progress-number': {
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: Theme.colors.primary.main,
          fontSize: '.9rem',
          color: Theme.text.primary,
          textAlign: 'center',
          lineHeight: '20px'
        },
        '.progress-complete': {
          background: `url(${assets.fullPath('img/complete.svg')})`,
          backgroundSize: 'cover',
          width: 20,
          height: 20,
          borderRadius: '50%'
        },
        '.item-status': {
          alignItems: 'center',
          fontSize: '1rem',
          $nest: {
            'i-icon': {
              width: '24px',
              height: '24px',
              marginRight: '0.25rem',
            },
          },
        },
        '.btn-dropdown': {
          paddingInline: '0.25rem',
          width: '100%',
          $nest: {
            '.caption': {
              justifyContent: 'start',
              cursor: 'pointer'
            },
            '> i-button': {
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              height: '2.5rem',
              justifyContent: 'flex-start'
            },
            '.modal': {
              padding: '0.25rem 0',
              marginTop: 0,
              border: `2px solid ${Theme.colors.primary.main}`,
              background: Theme.background.modal,
              borderRadius: 4,
              minWidth: 0,
              width: '100%',
              maxWidth: 410,
              $nest: {
                'i-button': {
                  display: 'block',
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  borderRadius: '0',
                  border: 'none',
                  boxShadow: 'none',
                  fontSize: '0.875rem',
                  height: 'auto',
                  textAlign: 'left',
                  $nest: {
                    '&:hover': {
                      opacity: 0.8,
                    },
                    'i-image': {
                      display: 'flex',
                      flexDirection: 'row-reverse',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    },
                    'img': {
                      width: '24px',
                      height: '24px',
                      marginRight: '0.25rem',
                    },
                  },
                },
                'i-button:last-child': {
                  marginBottom: 0
                }
              }
            }
          }
        },
        '.status-combobox': {
          width: '100%',
          $nest: {
            '.icon-btn': {
              background: 'transparent',
              border: 'none'
            },
            'input': {
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.125rem',
              width: '100%',
              color: Theme.text.primary,
              $nest: {
                '&:focus': {
                  outline: 0
                }
              }
            }
          }
        },
        '.summary': {
          padding: '0 1rem'
        },
        '.summary-row': {
          marginTop: '1rem',
          flexWrap: 'nowrap',
          $nest: {
            '&:last-child': {
              marginBottom: '1rem'
            },
            '&.row-right': {
              flexWrap: 'wrap',
            },
            'i-label *': {
              font: `normal normal bold 1rem/1rem ${Theme.typography.fontFamily}`,
              fontSize: '.9rem',
              lineHeight: '1.5rem',
              opacity: 0.8
            },
            '.summary-row_body i-label *': {
              color: Theme.text.primary,
              opacity: 1
            },
            '&.highlight-row .summary-row_body i-label.highlight-value *': {
              color: Theme.colors.primary.main
            },
            '&.summary-row--one': {
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              $nest: {
                '.summary-inner': {
                  display: 'flex',
                  textAlign: 'right',
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                },
                '.second-data *': {
                  opacity: 0.8,
                  fontSize: '.9rem'
                }
              }
            },
            '.summary-inner': {
              display: 'flex',
              justifyContent: 'space-between'
            }
          }
        },
        '.flex-col': {
          flexDirection: 'column',
        },
        '.row-right i-panel:last-child': {
          marginLeft: 'auto',
        },
        '.float-right': {
          display: 'flex',
          justifyContent: 'flex-end'
        },
        '.text-underline > *': {
          textDecoration: 'underline',
        },
        '.i-progress': {
          display: 'flex'
        }
      }
    },
    '.custom-group--icon': {
      $nest: {
        'i-icon': {
          display: 'flex'
        },
        '#settingLb > i-icon': {
          marginLeft: '1rem !important',
        }
      }
    },
    '#confirmationModal': {
      $nest: {
        '.modal': {
          background: Theme.background.modal,
          width: 600,
          maxWidth: '95%',
          padding: '0.75rem 1rem',
          borderRadius: '1rem',
          color: Theme.text.primary
        },
        '.i-modal_header': {
          display: 'none',
        },
        '.header': {
          marginTop: '0.5rem',
          marginBottom: 0,
          paddingBottom: 0,
          border: 'none',
          display: 'flex',
          justifyContent: 'flex-end',
          $nest: {
            'i-icon': {
              fill: Theme.colors.primary.main,
            }
          }
        },
        '.text-warning *': {
          color: Theme.colors.primary.main,
        },
        '.i-modal_content': {
          padding: '0 1rem 1rem',
        },
        'i-button': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '150px',
          height: '50px !important',
          fontWeight: 600,
          borderRadius: 5,
          margin: '0.5rem',
        },
        '.btn-cancel': {
          background: `${Theme.text.primary} !important`,
          color: `${Theme.background.main} !important`,
        }
      }
    },
    '@media screen and (max-width: 768px)': {
      $nest: {
        '.custom-container': {
          width: '480px',
          maxWidth: '100%'
        }
      },
    },
  }
}); 
