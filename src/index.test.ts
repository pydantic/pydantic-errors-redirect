import { unstable_dev } from "wrangler"
import type { UnstableDevWorker } from "wrangler"
import { describe, expect, it, beforeAll, afterAll } from "vitest"

describe("Worker", () => {
  let worker: UnstableDevWorker

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it("should 404 at root", async () => {
    const resp = await worker.fetch("/", { redirect: "manual" })
    const text = await resp.text()
    expect(resp.status).toMatchInlineSnapshot("200")
    expect(text).toMatchInlineSnapshot(
      '"Pydantic Errors Redirect, see https://github.com/pydantic/pydantic-errors-redirect for more info. Release SHA unknown."'
    )
  })

  it("should 404 for unexpected variant", async () => {
    const resp = await worker.fetch("/v2.0a3/z/decorator-missing-field", {
      redirect: "manual",
    })
    const text = await resp.text()
    expect(resp.status).toMatchInlineSnapshot("404")
    expect(text).toMatchInlineSnapshot('"Not Found"')
  })

  it("should redirect to usage docs", async () => {
    const resp = await worker.fetch("/v2.0a3/u/decorator-missing-field", {
      redirect: "manual",
    })
    const redirectUrl = resp.headers.get("Location")

    expect(resp.status).toMatchInlineSnapshot("307")
    expect(redirectUrl).toMatchInlineSnapshot(
      '"https://docs.pydantic.dev/dev-v2/usage/errors/#decorator-missing-field"'
    )
  })

  it("should redirect to validation docs", async () => {
    const resp = await worker.fetch("/v2.0a3/v/decorator-missing-field", {
      redirect: "manual",
    })
    const redirectUrl = resp.headers.get("Location")

    expect(resp.status).toMatchInlineSnapshot("307")
    expect(redirectUrl).toMatchInlineSnapshot(
      '"https://docs.pydantic.dev/dev-v2/usage/validation_errors/#decorator-missing-field"'
    )
  })

  it("should show message on /", async () => {
    const resp = await worker.fetch("/")
    const text = await resp.text()

    expect(resp.status).toMatchInlineSnapshot("200")
    expect(text).toMatchInlineSnapshot(
      '"Pydantic Errors Redirect, see https://github.com/pydantic/pydantic-errors-redirect for more info. Release SHA unknown."'
    )
  })

  it("should redirect to migration guide with no anchor", async () => {
    for (const url of ["/v2.0/migration", "/v2.0/migration/"]) {
      const resp = await worker.fetch(url, {
        redirect: "manual",
      })
      const redirectUrl = resp.headers.get("Location")

      expect(resp.status).toMatchInlineSnapshot("307")
      expect(redirectUrl).toMatchInlineSnapshot(
        '"https://docs.pydantic.dev/dev-v2/migration/"'
      )
    }
  })

  it("should redirect to migration guide with a proper anchor", async () => {
    const resp = await worker.fetch(
      "/v2.0/migration/validator-and-root_validator-are-deprecated",
      {
        redirect: "manual",
      }
    )
    const redirectUrl = resp.headers.get("Location")

    expect(resp.status).toMatchInlineSnapshot("307")
    expect(redirectUrl).toMatchInlineSnapshot(
      '"https://docs.pydantic.dev/dev-v2/migration/#validator-and-root_validator-are-deprecated"'
    )
  })

  it("should get download_count", async () => {
    const resp = await worker.fetch("/download-count/")
    expect(resp.status).toMatchInlineSnapshot("200")

    const text = await resp.text()
    expect(text).includes("M")
  })
})
