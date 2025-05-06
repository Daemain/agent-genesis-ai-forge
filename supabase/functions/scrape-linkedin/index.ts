
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const ELEVEN_LABS_API_KEY = Deno.env.get("ELEVEN_LABS_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, isCompany, useCase, voiceStyle, name, email, structuredData } = await req.json();
    
    if (!url) {
      throw new Error("URL is required");
    }

    // Create Supabase client with auth context from request
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://yizayhkscxjijxazbxcz.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // Get user ID from the auth context
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    // Use provided structured data or scrape the website
    const profileData = structuredData || await simulateScraping(url, isCompany);
    
    // Process with DeepSeek AI to generate agent content
    const { agentPrompt, knowledgeBase } = await generateAgentContent(profileData, useCase);
    
    // Create voice agent with ElevenLabs
    const elevenlabsAgentId = await createElevenLabsAgent(name, agentPrompt, voiceStyle);
    
    // Store in database
    const { data, error } = await supabase
      .from('agents')
      .insert({
        name,
        email,
        is_company: isCompany,
        url,
        use_case: useCase,
        voice_style: voiceStyle,
        scraped_data: profileData,
        agent_prompt: agentPrompt,
        knowledge_base: knowledgeBase,
        eleven_labs_agent_id: elevenlabsAgentId,
        user_id: user?.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Agent created successfully", 
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Simulate scraping - in a real application, use a proper scraping service
async function simulateScraping(url: string, isCompany: boolean) {
  console.log(`Simulating scraping for ${isCompany ? 'company' : 'profile'}: ${url}`);
  
  // This is a simulation - in a real app, you'd use a proper scraping service
  // LinkedIn actively blocks scraping, so you would need a specialized service
  
  if (isCompany) {
    return {
      companyProfile: {
        name: url.includes('linkedin.com/company/') 
          ? url.split('linkedin.com/company/')[1].split('/')[0].replace(/-/g, ' ') 
          : 'Sample Company',
        tagline: "A leading provider of innovative solutions in the industry.",
        toneOfVoice: "Professional, Insightful, Conversational",
        about: "This company was founded in 2010 and has been growing steadily since. They focus on delivering high-quality products to their customers and maintaining excellent customer relations.",
        productsServices: [
          { name: "Product A", description: "A flagship product that does X" },
          { name: "Service B", description: "A premium service for Y" }
        ],
        useCases: [
          "Enterprise Solutions",
          "Small Business Support"
        ],
        industriesServed: [
          "Technology",
          "Finance"
        ],
        faqs: [
          { question: "What do you offer?", answer: "We offer cutting-edge solutions for businesses." },
          { question: "How do I get started?", answer: "Contact our sales team to schedule a demo." }
        ],
        contactInfo: {
          website: url,
          email: "contact@company.com"
        }
      }
    };
  } else {
    return {
      individualProfile: {
        name: url.includes('linkedin.com/in/') 
          ? url.split('linkedin.com/in/')[1].split('/')[0].replace(/-/g, ' ') 
          : 'John Doe',
        title: "Sales Professional",
        headline: "Sales Professional | Business Development | Relationship Management",
        toneOfVoice: "Professional, Friendly, Knowledgeable",
        about: "Experienced sales professional with over 5 years in the technology sector. Specializes in building strong client relationships and exceeding sales targets.",
        coreSkills: [
          "Consultative Selling",
          "Relationship Building",
          "Client Management"
        ],
        servicesOffered: [
          "Sales Consulting",
          "Business Development"
        ],
        experienceHighlights: [
          { title: "Sales Manager", company: "Tech Solutions Inc.", date: "2020 - Present" },
          { title: "Sales Representative", company: "Digital Innovations Co.", date: "2018 - 2020" }
        ],
        education: "Bachelor's in Business Administration",
        contact: {
          email: "john@example.com"
        }
      }
    };
  }
}

// Generate agent content using DeepSeek API
async function generateAgentContent(profileData: any, useCase: string) {
  console.log("Generating agent content with DeepSeek AI");
  
  // Create prompt based on scraped data and use case
  const systemPrompt = `You are an AI assistant that creates sales agent prompts based on profile data.
  Create a detailed prompt for an AI agent that will act as a ${useCase} assistant for the following entity:
  ${JSON.stringify(profileData, null, 2)}
  
  Your response should include:
  1. A detailed agent prompt that explains how the AI should behave and respond
  2. A knowledge base of factual information about the entity that the AI can use
  
  Format your response as a JSON with two keys: "agentPrompt" and "knowledgeBase"`;
  
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Create a ${useCase} AI agent for the profile I've provided.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected DeepSeek API response:", data);
      throw new Error("Failed to generate agent content");
    }
    
    // Parse the response to extract the JSON content
    const content = data.choices[0].message.content;
    
    // Try to parse the JSON from the response
    try {
      const parsedContent = JSON.parse(content);
      return {
        agentPrompt: parsedContent.agentPrompt || "Default agent prompt",
        knowledgeBase: parsedContent.knowledgeBase || "Default knowledge base"
      };
    } catch (error) {
      console.error("Error parsing DeepSeek response:", error);
      
      // Fallback: extract content using regex if JSON parsing fails
      const agentPromptMatch = content.match(/"agentPrompt"\s*:\s*"([^"]*)"/);
      const knowledgeBaseMatch = content.match(/"knowledgeBase"\s*:\s*"([^"]*)"/);
      
      return {
        agentPrompt: agentPromptMatch ? agentPromptMatch[1] : "Default agent prompt",
        knowledgeBase: knowledgeBaseMatch ? knowledgeBaseMatch[1] : "Default knowledge base"
      };
    }
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    return {
      agentPrompt: `Default ${useCase} agent prompt based on provided profile.`,
      knowledgeBase: `Basic facts about the entity: ${JSON.stringify(profileData, null, 2)}`
    };
  }
}

// Create voice agent with ElevenLabs
async function createElevenLabsAgent(name: string, prompt: string, voiceStyle: string) {
  console.log("Creating ElevenLabs voice agent");
  
  // Map voice style to voice ID
  const voiceMap: Record<string, string> = {
    'professional': 'pNInz6obpgDQGcFmaJgB', // Adam voice
    'friendly': 'EXAVITQu4vr4xnSDxMaL',     // Sarah voice
    'energetic': 'yoZ06aMxZJJ28mfd3POQ',    // Josh voice
    'calm': 'ThT5KcBeYPX3keUQqHPh'          // Emily voice
  };
  
  const voiceId = voiceMap[voiceStyle] || voiceMap.professional;
  
  try {
    // Create a new agent using the ElevenLabs API
    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        name: `${name} - Sales Agent`,
        description: "An AI sales agent created with LinkedIn data",
        tts: {
          voice_id: voiceId
        },
        agent: {
          prompt: {
            prompt: prompt
          },
          language: "en",
          first_message: `Hi there! I'm ${name}, your AI assistant. How can I help you today?`
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error("Failed to create ElevenLabs agent");
    }
    
    const data = await response.json();
    
    // Return the agent ID for storage
    return data.agent_id || null;
  } catch (error) {
    console.error("Error creating ElevenLabs agent:", error);
    return null;
  }
}
