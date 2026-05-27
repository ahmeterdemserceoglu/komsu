import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=tr`,
      {
        headers: {
          "User-Agent": "KomsuPaylasimApp/1.0 (info@paylas.vercel.app)",
          "Accept-Language": "tr,en;q=0.9",
        },
        next: { revalidate: 3600 }, // Cache locations for 1 hour to reduce Nominatim load
      }
    );

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Location search proxy error:", error);
    return NextResponse.json({ error: "Location search failed" }, { status: 500 });
  }
}
