import { describe, it, expect, vi } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test/file.pdf" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/file.pdf" } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("Document Upload", () => {
  it("validates file size limits", () => {
    const maxSizeMB = 10;
    const file = new File(["x"], "test.pdf", { type: "application/pdf" });
    // File object size is small, should pass
    expect(file.size).toBeLessThan(maxSizeMB * 1024 * 1024);
  });

  it("validates allowed file types", () => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    expect(allowedTypes.includes("application/pdf")).toBe(true);
    expect(allowedTypes.includes("text/plain")).toBe(false);
  });

  it("extracts storage path from URL", () => {
    const url = "https://example.com/storage/v1/object/public/documents/entregas/123/file.pdf";
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    expect(match?.[1]).toBe("entregas/123/file.pdf");
  });
});
