
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
    const { url, isCompany, useCase, voiceStyle, name, email, structuredData, conversationFlow } = await req.json();
    
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
    
    let finalConversationFlow;
    let systemPrompt;
    let knowledgeBase;
    
    // If conversation flow is provided, use that
    if (conversationFlow && conversationFlow.length > 0) {
      console.log("Using provided conversation flow");
      finalConversationFlow = conversationFlow;
      
      // Still generate system prompt and knowledge base
      const generatedContent = await generateAgentContent(profileData, useCase, name, isCompany);
      systemPrompt = generatedContent.systemPrompt;
      knowledgeBase = generatedContent.knowledgeBase;
    } else {
      // Generate agent content based on structured data
      console.log("Generating conversation flow");
      const generatedContent = await generateAgentContent(profileData, useCase, name, isCompany);
      systemPrompt = generatedContent.systemPrompt;
      knowledgeBase = generatedContent.knowledgeBase;
      finalConversationFlow = generatedContent.conversationFlow;
    }
    
    // Create voice agent with ElevenLabs
    const elevenlabsAgentId = await createElevenLabsAgent(name, systemPrompt, voiceStyle, finalConversationFlow);
    
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
        agent_prompt: systemPrompt,
        knowledge_base: knowledgeBase,
        conversation_flow: finalConversationFlow,
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

// Generate agent content with customized system prompts and knowledge base
async function generateAgentContent(profileData: any, useCase: string, name: string, isCompany: boolean) {
  console.log("Generating agent content with customized templates");
  
  let systemPrompt = "";
  let knowledgeBase = {};
  let conversationFlow = [];
  
  // Generate system prompt based on the template and scraped data
  if (isCompany) {
    // Company template
    const companyProfile = profileData.companyProfile || {};
    const companyName = companyProfile.name || name;
    const industry = companyProfile.industriesServed?.[0] || "technology";
    const tone = companyProfile.toneOfVoice || "professional, friendly, helpful";
    
    systemPrompt = `You are an AI voice agent representing ${companyName}, a business that specializes in ${industry}.

Your goal is to introduce the company, explain its services/products, answer client inquiries, and direct people to the right resource.

Your tone is ${tone}, and you speak clearly and confidently about the company's:
- Mission and values
- Products or services
- Client success stories
- How to get started or speak to a real person

When uncertain, answer generally or offer to connect the user to support or sales.`;

    // Generate knowledge base in JSON format
    knowledgeBase = {
      company_name: companyName,
      industry: industry,
      summary: companyProfile.about || `${companyName} provides innovative solutions in the ${industry} industry.`,
      products: companyProfile.productsServices?.map((p: any) => p.name) || ["Products and services"],
      ideal_clients: companyProfile.industriesServed || ["Businesses"],
      case_study: "We have helped numerous clients achieve their goals through our innovative solutions.",
      website: companyProfile.contactInfo?.website || url,
      contact: companyProfile.contactInfo?.email || "contact@example.com"
    };
  } else {
    // Individual template
    const individualProfile = profileData.individualProfile || {};
    const fullName = individualProfile.name || name;
    const profession = individualProfile.title || "Professional";
    const skills = individualProfile.coreSkills || ["Professional skills"];
    const tone = individualProfile.toneOfVoice || "friendly, professional";
    
    systemPrompt = `You are an AI voice assistant representing ${fullName}, a ${profession} with expertise in ${skills.join(", ")}.

Your goal is to explain their background, services, and value clearly and confidently. Your personality is ${tone}, and your responses should reflect ${fullName}'s tone, achievements, and personal brand.

You answer questions about ${fullName}'s:
- Work experience
- Skills and achievements
- Projects or clients
- Availability or how to get in touch

If the question is unrelated, respond politely or guide the person back to relevant topics. Offer to share links or book a meeting when appropriate.`;

    // Generate knowledge base in JSON format
    knowledgeBase = {
      name: fullName,
      title: profession,
      summary: individualProfile.about || `${fullName} is a ${profession} with expertise in ${skills.join(", ")}.`,
      top_skills: skills,
      clients: individualProfile.servicesOffered || ["Clients"],
      portfolio_url: individualProfile.contact?.website || "personal-website.com",
      contact: individualProfile.contact?.email || "contact@example.com"
    };
  }

  try {
    // Try to generate conversation flow using OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert AI conversation designer who creates well-structured conversation flows."
          },
          {
            role: "user",
            content: `
Create a detailed conversation flow for an AI voice agent based on the following information:

SYSTEM PROMPT:
${systemPrompt}

KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

AGENT TYPE: ${isCompany ? 'Company' : 'Individual'}
USE CASE: ${useCase}

Create a comprehensive conversation flow with at least 5 different conversation scenarios that this AI voice agent would handle.
Each scenario should include:
1. The scenario name/type (e.g., "Introduction", "Product Questions", "Pricing", etc.)
2. 2-3 example user inputs/questions for this scenario as "userInputs"
3. 2-3 diverse AI responses for this scenario as "responses" 
4. 1-2 follow-up questions the AI might ask as "followUps"

Format your response as a valid JSON array like this example:
[
  {
    "scenario": "Introduction",
    "userInputs": ["Hi there", "Hello", "Who are you?"],
    "responses": ["Hi, I'm Sarah's AI assistant. How can I help you today?", "Hello! I'm an AI assistant for ABC Company. How may I assist you?"],
    "followUps": ["Would you like to learn more about our services?", "Is there something specific I can help you with today?"]
  }
]

Make sure the conversation flow is highly personalized to the specific knowledge base and system prompt.
Return ONLY valid JSON that can be parsed (no explanations or other text).
            `
          }
        ],
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Try to parse the JSON content
        conversationFlow = JSON.parse(content.trim());
        console.log("Successfully generated conversation flow with OpenAI");
      } catch (error) {
        console.error("Error parsing OpenAI-generated conversation flow:", error);
        // Fall back to the basic flow
        conversationFlow = generateConversationFlow(systemPrompt, knowledgeBase, isCompany, useCase);
      }
    } else {
      console.error("Error from OpenAI API:", await response.text());
      // Fall back to the basic flow
      conversationFlow = generateConversationFlow(systemPrompt, knowledgeBase, isCompany, useCase);
    }
  } catch (error) {
    console.error("Error generating flow with OpenAI:", error);
    // Fall back to the basic flow
    conversationFlow = generateConversationFlow(systemPrompt, knowledgeBase, isCompany, useCase);
  }
  
  return {
    systemPrompt,
    knowledgeBase: JSON.stringify(knowledgeBase, null, 2),
    conversationFlow
  };
}

// Generate conversation flow based on system prompt and knowledge base
function generateConversationFlow(systemPrompt: string, knowledgeBase: any, isCompany: boolean, useCase: string) {
  const name = isCompany ? knowledgeBase.company_name : knowledgeBase.name;
  
  // Base conversation flow for all use cases
  const baseConversation = [
    {
      scenario: "Introduction",
      userInputs: ["Hi there", "Hello", "Who are you?"],
      responses: [`Hi, I'm ${name}'s AI assistant. How can I help you today?`],
      followUps: ["Is there something specific you'd like to know?"]
    }
  ];
  
  // Add use-case specific conversation flows
  let additionalFlows = [];
  
  if (useCase === 'sales') {
    additionalFlows = [
      {
        scenario: "Products/Services",
        userInputs: ["What do you offer?", "Tell me about your products"],
        responses: [
          isCompany 
            ? `At ${knowledgeBase.company_name}, we offer a range of solutions including ${(knowledgeBase.products || []).join(", ")}. Would you like to learn more about any specific one?` 
            : `${knowledgeBase.name} specializes in ${(knowledgeBase.top_skills || []).join(", ")}. Would you like to hear more about these services?`
        ],
        followUps: ["Would you like more details on any specific offering?"]
      },
      {
        scenario: "Pricing",
        userInputs: ["How much does it cost?", "What are your prices?"],
        responses: [
          `Our pricing is customized based on your specific requirements. Would you like to schedule a consultation to discuss your needs?`
        ],
        followUps: ["What particular service are you interested in?"]
      },
      {
        scenario: "Call to Action",
        userInputs: ["How do we get started?", "I want to work with you"],
        responses: [
          `Would you like to schedule a call to discuss how we can help you?`,
          `What's the best way to reach you so we can provide more detailed information?`
        ],
        followUps: ["What's your email address?"]
      }
    ];
  } else if (useCase === 'customer-support') {
    additionalFlows = [
      {
        scenario: "Issue Troubleshooting",
        userInputs: ["I have a problem", "Something's not working"],
        responses: [
          `I'm sorry to hear you're having an issue. Could you please tell me more about what's happening so I can help you better?`
        ],
        followUps: ["When did you first notice this issue?"]
      },
      {
        scenario: "Follow-up",
        userInputs: ["What happens next?", "Will someone contact me?"],
        responses: [
          `Let me connect you with our support team who can help resolve this right away.`,
          `Would you like me to have someone from our team contact you directly?`
        ],
        followUps: ["What's the best way to reach you?"]
      }
    ];
  } else if (useCase === 'lead-qualification') {
    additionalFlows = [
      {
        scenario: "Qualification",
        userInputs: ["I'm interested in your services", "I want to know if we're a good fit"],
        responses: [
          `To help understand if we're a good fit, may I ask about your current needs and challenges?`
        ],
        followUps: ["What specific problems are you trying to solve?"]
      },
      {
        scenario: "Next Steps",
        userInputs: ["What now?", "How do we proceed?"],
        responses: [
          `Based on what you've shared, I think we could definitely help. Would you be interested in speaking with one of our specialists?`,
          `It sounds like you could benefit from our services. Would you like to schedule a demo?`
        ],
        followUps: ["What times work best for you?"]
      }
    ];
  }
  
  return [...baseConversation, ...additionalFlows];
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
    // Convert conversation flow to a format that's easy for the agent to understand
    const scenariosForPrompt = conversationFlow.map((scenario: any) => {
      return {
        topic: scenario.scenario,
        user_queries: scenario.userInputs,
        responses: scenario.responses,
        follow_ups: scenario.followUps || []
      };
    });
    
    // Enhanced prompt that includes conversation flow guidance
    const enhancedPrompt = `
      ${prompt}
      
      CONVERSATION FLOW GUIDANCE:
      ${JSON.stringify(scenariosForPrompt, null, 2)}
      
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
