import { filterOptions } from "@lerna/core";
import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "add <pkg> [globs..]",
  describe: "Add a single dependency to matched packages",
  builder(yargs) {
    yargs
      .positional("pkg", {
        describe: "Package name to add as a dependency",
        type: "string",
      })
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .positional("globs", {
        describe: "Optional package directory globs to match",
        type: "array",
      })
      .options({
        D: {
          group: "Command Options:",
          type: "boolean",
          alias: "dev",
          describe: "Save to devDependencies",
        },
        E: {
          group: "Command Options:",
          type: "boolean",
          alias: "exact",
          describe: "Save version exactly",
        },
        P: {
          group: "Command Options:",
          type: "boolean",
          alias: "peer",
          describe: "Save to peerDependencies",
        },
        registry: {
          group: "Command Options:",
          describe: "Use the specified registry for all npm client operations.",
          type: "string",
          requiresArg: true,
        },
        "no-bootstrap": {
          group: "Command Options:",
          describe: "Do not automatically chain `lerna bootstrap` after changes are made.",
          type: "boolean",
        },
        bootstrap: {
          // proxy for --no-bootstrap
          hidden: true,
          type: "boolean",
        },
      })
      .example(
        "$0 add module-1 packages/prefix-*",
        "Adds the module-1 package to the packages in the 'prefix-' prefixed folders"
      )
      .example("$0 add module-1 --scope=module-2", "Install module-1 to module-2")
      .example("$0 add module-1 --scope=module-2 --dev", "Install module-1 to module-2 in devDependencies")
      .example("$0 add module-1 --scope=module-2 --peer", "Install module-1 to module-2 in peerDependencies")
      .example("$0 add module-1", "Install module-1 in all modules except module-1")
      .example("$0 add module-1 --no-bootstrap", "Skip automatic `lerna bootstrap`")
      .example("$0 add babel-core", "Install babel-core in all modules");

    return filterOptions(yargs);
  },
  handler(argv) {
    return require(".")(argv);
  },
};

module.exports = command;
