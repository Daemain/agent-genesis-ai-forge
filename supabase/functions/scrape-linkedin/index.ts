
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
    
    // Generate agent content based on structured data
    const { agentPrompt, knowledgeBase, conversationFlow } = await generateAgentContent(profileData, useCase, name);
    
    // Create voice agent with ElevenLabs
    const elevenlabsAgentId = await createElevenLabsAgent(name, agentPrompt, voiceStyle, conversationFlow);
    
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
        conversation_flow: conversationFlow,
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
async function generateAgentContent(profileData: any, useCase: string, name: string) {
  console.log("Generating agent content with DeepSeek AI");
  
  // Create prompt based on scraped data and use case
  const systemPrompt = `You are an AI assistant that creates sales agent prompts and conversation flows based on profile data.
  Create a detailed prompt and conversation flow for an AI voice agent that will act as a ${useCase} assistant for the following entity:
  ${JSON.stringify(profileData, null, 2)}
  
  Your response should include:
  1. A detailed agent prompt that explains how the AI should behave and respond
  2. A knowledge base of factual information about the entity that the AI can use
  3. A conversation flow with sample dialogues for common scenarios
  
  Format your response as a valid JSON object with three keys: "agentPrompt", "knowledgeBase", and "conversationFlow"
  
  The conversationFlow should include various conversation scenarios with natural-sounding responses that include pauses (use commas and ellipses) and emphasis (use CAPS for emphasized words) to guide the voice synthesis.
  
  Each scenario in conversationFlow should end with an appropriate call-to-action like scheduling a call or visiting the website.`;
  
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
            content: `Create a ${useCase} AI voice agent for the profile I've provided. Make it sound natural and conversational with appropriate pauses and emphasis.`
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
    
    // Try to extract JSON from the response even if it's wrapped in markdown code blocks
    try {
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```(json)?\n?|\n?```/g, '');
      const parsedContent = JSON.parse(jsonContent);
      return {
        agentPrompt: parsedContent.agentPrompt || `Default ${useCase} agent prompt for ${name}`,
        knowledgeBase: parsedContent.knowledgeBase || `Basic facts about ${name}`,
        conversationFlow: parsedContent.conversationFlow || [
          {
            scenario: "Introduction",
            responses: [`Hi, I'm ${name}'s AI assistant. How can I help you today?`]
          }
        ]
      };
    } catch (error) {
      console.error("Error parsing DeepSeek response:", error);
      console.log("Response content:", content);
      
      // Fallback response if JSON parsing fails
      return {
        agentPrompt: `Default ${useCase} agent prompt for ${name}`,
        knowledgeBase: `Basic facts about ${name} based on provided profile`,
        conversationFlow: [
          {
            scenario: "Introduction",
            responses: [`Hi, I'm ${name}'s AI assistant. How can I help you today?`]
          },
          {
            scenario: "Services",
            responses: [`${name} offers various services to help with your business needs. Would you like to schedule a call to learn more?`]
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    return {
      agentPrompt: `Default ${useCase} agent prompt based on provided profile.`,
      knowledgeBase: `Basic facts about the entity: ${JSON.stringify(profileData, null, 2)}`,
      conversationFlow: [
        {
          scenario: "Introduction",
          responses: [`Hi, I'm ${name}'s AI assistant. How can I help you today?`]
        }
      ]
    };
  }
}

// Create voice agent with ElevenLabs
async function createElevenLabsAgent(name: string, prompt: string, voiceStyle: string, conversationFlow: any) {
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
    // Enhanced prompt that includes conversation flow guidance
    const enhancedPrompt = `
      ${prompt}
      
      CONVERSATION FLOW GUIDANCE:
      ${JSON.stringify(conversationFlow, null, 2)}
      
      INSTRUCTIONS FOR VOICE:
      - Use natural pauses indicated by commas and ellipses
      - Emphasize words in ALL CAPS
      - End most responses with a call-to-action
      - Match the tone and style described in the profile
    `;
    
    // Create a new agent using the ElevenLabs API
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: `Hello, I'm ${name}'s AI assistant. How can I help you today?`,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        },
        voice_id: voiceId
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error("Failed to create ElevenLabs agent");
    }
    
    // In a real implementation, you would store the audio or agent ID
    // For now, we'll return a placeholder ID
    return `el-agent-${Date.now()}`;
  } catch (error) {
    console.error("Error creating ElevenLabs agent:", error);
    return null;
  }
}
