import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FetchProfileRequest {
  profileUrl: string;
}

interface LinkedInProfileData {
  linkedin_id: string;
  full_name: string;
  headline?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field_of_study?: string;
  }>;
  skills?: string[];
  connections_count?: number;
  profile_url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { profileUrl }: FetchProfileRequest = await req.json();

    if (!profileUrl) {
      return new Response(
        JSON.stringify({ error: "profileUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkedinIdMatch = profileUrl.match(/linkedin\.com\/in\/([\w-]+)/);
    if (!linkedinIdMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid LinkedIn URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkedinId = linkedinIdMatch[1];

    const mockData: LinkedInProfileData = {
      linkedin_id: linkedinId,
      full_name: `Profile ${linkedinId}`,
      headline: "Professional on LinkedIn",
      location: "United States",
      summary: "Experienced professional with multiple years in the industry.",
      experience: [
        {
          company: "Tech Company",
          title: "Senior Professional",
          start_date: "2020-01",
        },
      ],
      education: [
        {
          school: "University",
          degree: "Bachelor's",
          field_of_study: "Computer Science",
        },
      ],
      skills: ["Leadership", "Strategy", "Communication"],
      connections_count: 500,
      profile_url: profileUrl,
    };

    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
