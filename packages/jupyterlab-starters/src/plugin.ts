import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { IIconRegistry } from '@jupyterlab/ui-components';
import { MainAreaWidget } from '@jupyterlab/apputils';

import '../style/index.css';

import DEFAULT_ICON_SVG from '!!raw-loader!../style/icons/starter.svg';

import { StarterManager } from './manager';

import {
  NS,
  CommandIDs,
  DEFAULT_ICON_NAME,
  DEFAULT_ICON_CLASS,
  CATEGORY,
  IStartContext
} from './tokens';
import { BodyBuilder } from './bodybuilder';

const plugin: JupyterFrontEndPlugin<void> = {
  id: `${NS}:plugin`,
  requires: [ILauncher, IIconRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    icons: IIconRegistry
  ) => {
    const { commands } = app;
    const manager = new StarterManager();
    const icon = { name: DEFAULT_ICON_NAME, svg: DEFAULT_ICON_SVG };
    icons.addIcon(icon);

    commands.addCommand(CommandIDs.start, {
      execute: async (args: any) => {
        const context = (args as any) as IStartContext;
        const { starter, name, cwd, body } = context;

        if (starter.schema && !body) {
          const content = new BodyBuilder({ manager, context });
          const main = new MainAreaWidget({ content });
          app.shell.add(main, 'main', { mode: 'split-right' });
          content.continue.connect(async (builder, context) => {
            await commands.execute(CommandIDs.start, context as any);
            main.dispose();
          });
        } else {
          await manager.start(name, cwd, body);
          if (starter.commands) {
            for (const cmd of starter.commands) {
              await commands.execute(cmd.id, cmd.args);
            }
          }
        }
      },
      label: (args: any) => args.starter.label,
      caption: (args: any) => args.starter.description,
      iconClass: (args: any) => args.starter.icon || DEFAULT_ICON_CLASS
    });

    manager.changed.connect(() => {
      const { starters } = manager;
      for (const name in starters) {
        launcher.add({
          command: CommandIDs.start,
          args: { name, starter: starters[name] },
          category: CATEGORY
        });
      }
    });

    manager.fetch().catch(console.warn);
  }
};

export default plugin;
