
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileData, useCase, name, isCompany, voiceStyle, customPrompt } = await req.json();
    
    if (!profileData) {
      throw new Error("Profile data is required");
    }

    // Create system prompt based on template and scraped data
    const systemPrompt = generateSystemPrompt(profileData, useCase, name, isCompany, customPrompt);
    
    // Generate conversation flow using Deepseek (with OpenAI fallback)
    const conversationFlow = await generateConversationFlowWithAI(
      systemPrompt, 
      profileData, 
      isCompany, 
      useCase,
      voiceStyle
    );
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          systemPrompt,
          conversationFlow
        }
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

// Generate system prompt based on the template and scraped data
function generateSystemPrompt(profileData: any, useCase: string, name: string, isCompany: boolean, customPrompt?: string) {
  // If custom prompt is provided, use it
  if (customPrompt) {
    return customPrompt;
  }
  
  // Generate system prompt based on the template and scraped data
  if (isCompany) {
    // Company template
    const companyProfile = profileData.companyProfile || {};
    const companyName = companyProfile.name || name;
    const industry = companyProfile.industriesServed?.[0] || "technology";
    const tone = companyProfile.toneOfVoice || "professional, friendly, helpful";
    
    return `You are an AI voice agent representing ${companyName}, a business that specializes in ${industry}.

Your goal is to introduce the company, explain its services/products, answer client inquiries, and direct people to the right resource.

Your tone is ${tone}, and you speak clearly and confidently about the company's:
- Mission and values
- Products or services
- Client success stories
- How to get started or speak to a real person

When uncertain, answer generally or offer to connect the user to support or sales.`;
  } else {
    // Individual template
    const individualProfile = profileData.individualProfile || {};
    const fullName = individualProfile.name || name;
    const profession = individualProfile.title || "Professional";
    const skills = individualProfile.coreSkills || ["Professional skills"];
    const tone = individualProfile.toneOfVoice || "friendly, professional";
    
    return `You are an AI voice assistant representing ${fullName}, a ${profession} with expertise in ${skills.join(", ")}.

Your goal is to explain their background, services, and value clearly and confidently. Your personality is ${tone}, and your responses should reflect ${fullName}'s tone, achievements, and personal brand.

You answer questions about ${fullName}'s:
- Work experience
- Skills and achievements
- Projects or clients
- Availability or how to get in touch

If the question is unrelated, respond politely or guide the person back to relevant topics. Offer to share links or book a meeting when appropriate.`;
  }
}

// Generate conversation flow with AI
async function generateConversationFlowWithAI(
  systemPrompt: string, 
  profileData: any, 
  isCompany: boolean, 
  useCase: string,
  voiceStyle: string
) {
  try {
    const knowledgeBase = generateKnowledgeBase(profileData, isCompany);
    
    const promptData = {
      systemPrompt,
      knowledgeBase,
      isCompany,
      useCase,
      voiceStyle,
      name: isCompany ? profileData.companyProfile?.name : profileData.individualProfile?.name
    };
    
    const conversationFlowPrompt = `
You are an expert AI conversation designer. Create a detailed conversation flow for an AI voice agent based on the following information:

SYSTEM PROMPT:
${systemPrompt}

KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

AGENT TYPE: ${isCompany ? 'Company' : 'Individual'}
USE CASE: ${useCase}
VOICE STYLE: ${voiceStyle}

Create a comprehensive conversation flow with at least 8 different conversation scenarios that this AI voice agent would handle.
Each scenario should include:
1. The scenario name/type (e.g., "Introduction", "Product Questions", "Pricing", etc.)
2. 2-4 example user inputs/questions for this scenario
3. 2-4 diverse AI responses for this scenario, matching the specified voice style
4. Next steps or follow-up questions the AI might ask

Format your response as a valid JSON array like this example:
[
  {
    "scenario": "Introduction",
    "userInputs": ["Hi there", "Hello", "Who are you?"],
    "responses": ["Hi, I'm Sarah's AI assistant. How can I help you today?", "Hello! I'm an AI assistant for ABC Company. How may I assist you?"],
    "followUps": ["Would you like to learn more about our services?", "Is there something specific I can help you with today?"]
  },
  {
    "scenario": "Another scenario name",
    "userInputs": ["example question 1", "example question 2"],
    "responses": ["example response 1", "example response 2"],
    "followUps": ["follow-up 1", "follow-up 2"]
  }
]

Important: Make sure the conversation flow:
1. Is highly personalized to the specific knowledge base and system prompt
2. Matches the selected voice style (${voiceStyle})
3. Is optimized for the use case (${useCase})
4. Uses natural, conversational language
5. Has responses that sound like they come from a real person
6. Returns ONLY valid JSON that can be parsed (no explanations or other text)
`;

    // Try using Deepseek API first
    if (DEEPSEEK_API_KEY) {
      try {
        console.log("Using Deepseek API for conversation flow generation");
        
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: "You are an expert AI conversation designer who creates well-structured conversation flows." },
              { role: "user", content: conversationFlowPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Deepseek API error:", errorText);
          throw new Error(`Deepseek API error: ${errorText}`);
        }
        
        const data = await response.json();
        const generatedContent = data.choices[0].message.content;
        
        // Parse the generated JSON content
        try {
          const parsedFlow = JSON.parse(generatedContent.trim());
          console.log("Successfully generated conversation flow with Deepseek");
          return parsedFlow;
        } catch (error) {
          console.error("Error parsing Deepseek generated conversation flow:", error);
          throw new Error("Failed to parse Deepseek response");
        }
      } catch (deepseekError) {
        console.error("Error with Deepseek API:", deepseekError);
        // If Deepseek fails, fall back to OpenAI if available
        if (OPENAI_API_KEY) {
          console.log("Falling back to OpenAI API");
          return await generateConversationFlowWithOpenAI(conversationFlowPrompt);
        } else {
          throw deepseekError; // Re-throw if no fallback available
        }
      }
    } else if (OPENAI_API_KEY) {
      // Use OpenAI if Deepseek key is not available
      console.log("Deepseek API key not found, using OpenAI API");
      return await generateConversationFlowWithOpenAI(conversationFlowPrompt);
    } else {
      // No API keys available
      console.error("No API keys available for AI providers");
      throw new Error("No API keys available for conversation flow generation");
    }
  } catch (error) {
    console.error("Error generating conversation flow with AI:", error);
    // Fallback to generate basic conversation flow
    return generateBasicConversationFlow(systemPrompt, generateKnowledgeBase(profileData, isCompany), isCompany, useCase);
  }
}

// Function to generate conversation flow with OpenAI
async function generateConversationFlowWithOpenAI(conversationFlowPrompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert AI conversation designer who creates well-structured conversation flows." },
        { role: "user", content: conversationFlowPrompt }
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }
  
  const data = await response.json();
  const generatedContent = data.choices[0].message.content;
  
  // Parse the generated JSON content
  try {
    const parsedFlow = JSON.parse(generatedContent.trim());
    console.log("Successfully generated conversation flow with OpenAI");
    return parsedFlow;
  } catch (error) {
    console.error("Error parsing OpenAI generated conversation flow:", error);
    throw new Error("Failed to parse OpenAI response");
  }
}

// Generate knowledge base in JSON format
function generateKnowledgeBase(profileData: any, isCompany: boolean) {
  if (isCompany) {
    const companyProfile = profileData.companyProfile || {};
    return {
      company_name: companyProfile.name || "Company Name",
      industry: companyProfile.industriesServed?.[0] || "Technology",
      summary: companyProfile.about || "Company description",
      products: companyProfile.productsServices?.map((p: any) => p.name) || ["Products and services"],
      ideal_clients: companyProfile.industriesServed || ["Businesses"],
      case_study: "We have helped numerous clients achieve their goals through our innovative solutions.",
      website: companyProfile.contactInfo?.website || "company.com",
      contact: companyProfile.contactInfo?.email || "contact@example.com"
    };
  } else {
    const individualProfile = profileData.individualProfile || {};
    return {
      name: individualProfile.name || "Professional Name",
      title: individualProfile.title || "Professional",
      summary: individualProfile.about || "Professional description",
      top_skills: individualProfile.coreSkills || ["Professional skills"],
      clients: individualProfile.servicesOffered || ["Clients"],
      portfolio_url: individualProfile.contact?.website || "personal-website.com",
      contact: individualProfile.contact?.email || "contact@example.com"
    };
  }
}

// Fallback: Generate basic conversation flow
function generateBasicConversationFlow(systemPrompt: string, knowledgeBase: any, isCompany: boolean, useCase: string) {
  const name = isCompany ? knowledgeBase.company_name : knowledgeBase.name;
  
  // Base conversation flow for all use cases
  const baseConversation = [
    {
      scenario: "Introduction",
      userInputs: ["Hi there", "Hello", "Who are you?"],
      responses: [`Hi, I'm ${name}'s AI assistant. How can I help you today?`, `Hello! I'm an AI voice agent for ${name}. What can I assist you with?`],
      followUps: ["Is there something specific you'd like to know?", "How can I help you today?"]
    }
  ];
  
  // Add use-case specific conversation flows
  let additionalFlows = [];
  
  if (useCase === 'sales') {
    additionalFlows = [
      {
        scenario: "Products/Services",
        userInputs: ["What do you offer?", "Tell me about your products", "What services do you provide?"],
        responses: [
          isCompany 
            ? `At ${knowledgeBase.company_name}, we offer a range of solutions including ${(knowledgeBase.products || []).join(", ")}. Would you like to learn more about any specific one?` 
            : `${knowledgeBase.name} specializes in ${(knowledgeBase.top_skills || []).join(", ")}. Would you like to hear more about these services?`
        ],
        followUps: ["Would you like more details on any specific offering?", "Do you have any questions about our solutions?"]
      },
      {
        scenario: "Pricing",
        userInputs: ["How much does it cost?", "What are your prices?", "Tell me about pricing"],
        responses: [
          `Our pricing is customized based on your specific requirements. Would you like to schedule a consultation to discuss your needs?`
        ],
        followUps: ["What particular service are you interested in?", "Would you like me to have someone from our team reach out with pricing details?"]
      },
      {
        scenario: "Call to Action",
        userInputs: ["How do we get started?", "I want to work with you", "Next steps"],
        responses: [
          `Would you like to schedule a call to discuss how we can help you?`,
          `What's the best way to reach you so we can provide more detailed information?`
        ],
        followUps: ["What's your email address?", "When would be a good time for a follow-up call?"]
      }
    ];
  } else if (useCase === 'customer-support') {
    additionalFlows = [
      {
        scenario: "Issue Troubleshooting",
        userInputs: ["I have a problem", "Something's not working", "Need help with an issue"],
        responses: [
          `I'm sorry to hear you're having an issue. Could you please tell me more about what's happening so I can help you better?`
        ],
        followUps: ["When did you first notice this issue?", "Have you tried any solutions already?"]
      },
      {
        scenario: "Follow-up",
        userInputs: ["What happens next?", "Will someone contact me?", "How do I check status?"],
        responses: [
          `Let me connect you with our support team who can help resolve this right away.`,
          `Would you like me to have someone from our team contact you directly?`
        ],
        followUps: ["What's the best way to reach you?", "Do you have a case number from a previous interaction?"]
      }
    ];
  } else if (useCase === 'lead-qualification') {
    additionalFlows = [
      {
        scenario: "Qualification",
        userInputs: ["I'm interested in your services", "I want to know if we're a good fit", "Tell me if you can help with..."],
        responses: [
          `To help understand if we're a good fit, may I ask about your current needs and challenges?`
        ],
        followUps: ["What specific problems are you trying to solve?", "What solutions have you tried before?"]
      },
      {
        scenario: "Next Steps",
        userInputs: ["What now?", "How do we proceed?", "I think we're a good match"],
        responses: [
          `Based on what you've shared, I think we could definitely help. Would you be interested in speaking with one of our specialists?`,
          `It sounds like you could benefit from our services. Would you like to schedule a demo?`
        ],
        followUps: ["What times work best for you?", "Who else from your team should be involved in the next discussion?"]
      }
    ];
  }
  
  return [...baseConversation, ...additionalFlows];
}
