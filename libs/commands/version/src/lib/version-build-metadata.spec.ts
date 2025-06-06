import { promptSelectOne as _promptSelectOne, promptTextInput as _promptTextInput } from "@lerna/core";
import { commandRunner, initFixtureFactory, showCommit } from "@lerna/test-helpers";
import path from "path";
import { makePromptVersion } from "./prompt-version";

jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

const promptTextInput = jest.mocked(_promptTextInput);

// The mocked version isn't the same as the real one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promptSelectOne = _promptSelectOne as any;

jest.mock("./git-push");
jest.mock("./is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockReturnValue(true),
}));
jest.mock("./is-behind-upstream", () => ({
  isBehindUpstream: jest.fn().mockReturnValue(false),
}));
jest.mock("./remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

const resolvePrereleaseId = jest.fn(() => "alpha");
const versionPrompt = (buildMetadata) => makePromptVersion(resolvePrereleaseId, buildMetadata);

// helpers
const initFixture = initFixtureFactory(path.resolve(__dirname, "../../publish/__tests__"));

// file under test

const lernaVersion = commandRunner(require("../command"));

describe("--build-metadata without prompt", () => {
  it("accepts build metadata for explicit version", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("1.0.1", "--build-metadata", "20130313144700");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata for explicit version", async () => {
    const testDir = await initFixture("build-metadata");
    await lernaVersion(testDir)("1.0.1", "--build-metadata", "20130313144700");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata with semver keyword", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("minor", "--build-metadata", "001");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("should error when --repo-version is used", async () => {
    const testDir = await initFixture("normal");
    await expect(
      lernaVersion(testDir)("--repo-version", "1.0.2", "--build-metadata", "21AF26D3--117B344092BD")
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"--repo-version was replaced by positional [bump]. We recommend running \`lerna repair\` in order to ensure your lerna.json is up to date, otherwise check your CLI usage and/or any configs you extend from."`
    );
  });

  it("should error when --cd-version is used", async () => {
    const testDir = await initFixture("normal");
    await expect(
      lernaVersion(testDir)("--cd-version", "premajor", "--build-metadata", "exp.sha.5114f85")
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"--cd-version was replaced by positional [bump]. We recommend running \`lerna repair\` in order to ensure your lerna.json is up to date, otherwise check your CLI usage and/or any configs you extend from."`
    );
  });

  it("accepts build metadata with default prerelease id", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("prerelease", "--build-metadata", "20130313144700");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata across independent versions with semver keyword", async () => {
    const testDir = await initFixture("independent");
    await lernaVersion(testDir)("minor", "--build-metadata", "001");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata across independent versions with semver keyword", async () => {
    const testDir = await initFixture("independent-build-metadata");
    await lernaVersion(testDir)("minor", "--build-metadata", "exp.sha.5114f85");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});

describe("--build-metadata with prompt", () => {
  it("accepts build metadata", async () => {
    const testDir = await initFixture("normal");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "20130313144700");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata", async () => {
    const testDir = await initFixture("build-metadata");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "20130313144700");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata across independent versions", async () => {
    const testDir = await initFixture("independent");
    promptSelectOne.chooseBump("patch");
    promptSelectOne.chooseBump("minor");
    promptSelectOne.chooseBump("major");
    promptSelectOne.chooseBump("minor");
    promptSelectOne.chooseBump("patch");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "21AF26D3--117B344092BD");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata across independent versions", async () => {
    const testDir = await initFixture("independent-build-metadata");
    promptSelectOne.chooseBump("patch");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "exp.sha.5114f85");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});

describe("--build-metadata in version prompt", () => {
  test.each([
    ["patch", "1.0.1+001"],
    ["minor", "1.1.0+001"],
    ["major", "2.0.0+001"],
    ["prepatch", "1.0.1-alpha.0+001"],
    ["preminor", "1.1.0-alpha.0+001"],
    ["premajor", "2.0.0-alpha.0+001"],
  ])("accepts build metadata for prompted choice %s", async (bump, result) => {
    promptSelectOne.chooseBump(bump);

    const choice = await versionPrompt("001")({ version: "1.0.0" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(choice).toBe(result);
  });

  it("updates build metadata for prompted choice", async () => {
    promptSelectOne.chooseBump("patch");

    const choice = await versionPrompt("20130313144700")({ version: "1.0.0+001" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0+001)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(choice).toBe("1.0.1+20130313144700");
  });

  it("accepts build metadata for prompted prerelease version", async () => {
    let inputFilter;

    promptSelectOne.chooseBump("PRERELEASE");
    promptTextInput.mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      return Promise.resolve(msg);
    });

    await versionPrompt("exp.sha.5114f85")({ version: "1.0.0" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(inputFilter("rc")).toBe("1.0.1-rc.0+exp.sha.5114f85");
  });

  it("accepts build metadata for prompted custom version", async () => {
    let inputFilter;
    let inputValidate;

    promptSelectOne.chooseBump("CUSTOM");
    promptTextInput.mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      inputValidate = cfg.validate;
      return Promise.resolve(msg);
    });

    await versionPrompt("20130313144700")({ version: "1.0.0" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(inputValidate(inputFilter("2.0.0+20130313144700"))).toBe(true);
  });
});
