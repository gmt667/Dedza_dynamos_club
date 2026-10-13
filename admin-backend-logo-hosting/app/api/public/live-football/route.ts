import { getSulomLiveData } from "../../../../lib/sulom";

export async function GET() {
  try {
    const data = await getSulomLiveData();
    return Response.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Official football data is temporarily unavailable.",
        matches: [],
        table: [],
        dedza: null,
      },
      {
        status: 503,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      },
    );
  }
}

