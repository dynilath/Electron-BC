import { app, shell } from 'electron'
import { MyAppMenuConstructorOption } from './type'
import { openChangelog } from '../changelog'
import { BCURLPreference } from '../../urlprefer'
import { MyPrompt } from '../MyPrompt'

export function aboutMenu ({
  BCVersion,
  parent, refreshPage
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const { i18n } = parent
  return {
    label: i18n('MenuItem::About'),
    submenu: [
      {
        label: i18n('MenuItem::About::ChooseBCURL'),
        type: 'submenu',
        submenu: [
          {
            label: i18n('MenuItem::About::ChooseBCURLInfo1'),
            sublabel: i18n('MenuItem::About::ChooseBCURLInfo2'),
            type: 'normal',
            enabled: false,
          },
          {type: 'separator'},
          ...(BCURLPreference.choices.map(v => ({
            label: v.url,
            type: 'radio',
            checked: v.url === BCVersion.url,
            click: async () => {
              console.log(`Setting preferred prefix to ${v.url}`)
              BCURLPreference.setPreferredPrefix(v)
              await refreshPage()
            },
          })) as Electron.MenuItemConstructorOptions[]),
          { type: 'separator' },
          {
            label: i18n('MenuItem::About::InputURL'),
            sublabel: i18n('MenuItem::About::InputURLInfo'),
            type: 'normal',
            click: async () => {
              const result = await MyPrompt.input(parent, {
                title: i18n('MenuItem::About::InputURL'),
                content: i18n('MenuItem::About::InputURLInfo'),
                inputError: i18n('Alert::LoadUrl::PleaseInputCorrectUrl'),
                inputPlaceholder: BCURLPreference.choice.url,
              });
              if (result) {
                BCURLPreference.setCustomURL(result);
                await refreshPage();
              }
            },
          }
        ],
      },
      {
        type: 'separator',
      },
      {
        label: i18n('MenuItem::About::BCVersion'),
        type: 'normal',
        enabled: false,
        sublabel: BCVersion.version,
      },
      {
        label: i18n('MenuItem::About::Version'),
        type: 'normal',
        enabled: false,
        sublabel: app.getVersion(),
      },
      {
        type: 'separator',
      },
      {
        label: i18n('MenuItem::About::ChangeLog'),
        type: 'normal',
        click: () => {
          openChangelog()
        },
      },
      {
        label: i18n('MenuItem::About::Suggestions'),
        type: 'normal',
        click: () => {
          shell.openExternal('https://github.com/dynilath/Electron-BC/issues')
        },
      },
      {
        label: i18n('MenuItem::About::GitHub'),
        type: 'normal',
        click: () => {
          shell.openExternal('https://github.com/dynilath/Electron-BC')
        },
      },
    ],
  }
}
