import { Command } from "../deps.ts";
import { GithubProvider, Versions } from "./github_provider.ts";

export interface UpgradeCommandOptions {
  githubProvider: GithubProvider;
}

export class GithubUpgradeCommand extends Command {
  private readonly githubProvider: Readonly<GithubProvider>;

  constructor({ githubProvider }: UpgradeCommandOptions) {
    super();
    this.githubProvider = githubProvider;

    this
      .description(() =>
        `Upgrade ${this.getMainCommand().getName()} executable to latest or given version.`
      )
      .noGlobals()
      .option(
        "-l, --list-versions",
        "Show available versions.",
        {
          action: async () => {
            await this.githubProvider.listVersions(
              this.getMainCommand().getName(),
              this.getVersion(),
            );
            Deno.exit(0);
          },
        },
      )
      .option(
        "--version <version:string:version>",
        "The version to upgrade to.",
        { default: "latest" },
      )
      .option(
        "-f, --force",
        "Replace current installation even if not out-of-date.",
      )
      .complete("version", () => this.getAllVersions())
      .action(async ({ version: targetVersion, force }) => {
        const name: string = this.getMainCommand().getName();
        const currentVersion: string | undefined = this.getVersion();
        if (
          force || !currentVersion ||
          await this.githubProvider.isOutdated(
            name,
            currentVersion,
            targetVersion,
          )
        ) {
          await this.githubProvider.upgrade({
            name,
            from: currentVersion,
            to: targetVersion,
          });
        }
      });
  }
  public async getAllVersions(): Promise<Array<string>> {
    const { versions } = await this.getVersions();
    return versions;
  }
  public getVersions(): Promise<Versions> {
    return this.githubProvider.getVersions(
      this.getMainCommand().getName(),
    );
  }
}
