import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, isCompany, name, email } = await req.json();
    
    if (!url) {
      throw new Error("URL is required");
    }

    // In a real implementation, we'd use a proper scraping service or API
    // For now, we'll extract structured information based on the URL and company type
    const extractedData = await extractStructuredInformation(url, isCompany, name, email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData
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

async function extractStructuredInformation(url: string, isCompany: boolean, name: string, email: string) {
  console.log(`Extracting structured information for ${isCompany ? 'company' : 'individual'}: ${url}`);
  
  // Check if it's a LinkedIn URL
  const isLinkedIn = url.toLowerCase().includes('linkedin.com');
  
  // This is a simulated extraction - in a real app, you'd use a specialized service
  // or AI model to extract this information from the webpage content
  
  if (isCompany) {
    const extractedName = name || extractNameFromUrl(url);
    
    // Company JSON template
    return {
      companyProfile: {
        company_name: extractedName,
        about_us: `${extractedName} is a leading provider of innovative solutions helping businesses grow and succeed in the digital age. Focused on delivering exceptional value and measurable results for clients across various industries.`,
        tagline: `AI-Powered solutions for business growth`,
        services_or_products: [
          { name: "AI Sales Agents", description: "Conversational AI that understands your products and helps close sales" },
          { name: "Customer Support Bots", description: "24/7 automated customer service that feels personal" },
          { name: "Lead Qualification", description: "AI-powered lead scoring and qualification" }
        ].map(item => `${item.name}: ${item.description}`).join("\n"),
        target_audience: "Tech-forward businesses looking to automate customer interactions and increase sales efficiency",
        use_case: "Sales automation, customer support, and lead qualification",
        voice_tone: "Professional, Insightful, Conversational", 
        agent_greeting: `Hi there! I'm the AI assistant for ${extractedName}. How can I help you today?`,
        agent_intro: `I'm here to answer your questions about ${extractedName}'s products and services, and help you determine if our solutions are a good fit for your business.`,
        value_offer: `${extractedName} helps businesses like yours increase conversion rates by 35% and reduce support costs by up to 60% through our AI-driven solutions.`,
        support_actions: "Product demos, pricing information, case studies, scheduling calls with representatives",
        call_to_action: "Would you like to schedule a free consultation to see how our AI solutions can help your business?"
      },
      // Keep original data structure for backward compatibility
      originalData: {
        name: extractedName,
        tagline: `AI-Powered solutions for business growth`,
        toneOfVoice: "Professional, Insightful, Conversational",
        about: `A leading provider of innovative solutions helping businesses grow and succeed in the digital age. Focused on delivering exceptional value and measurable results for clients across various industries.`,
        productsServices: [
          { name: "AI Sales Agents", description: "Conversational AI that understands your products and helps close sales" },
          { name: "Customer Support Bots", description: "24/7 automated customer service that feels personal" },
          { name: "Lead Qualification", description: "AI-powered lead scoring and qualification" }
        ],
        useCases: [
          "AI Sales Agents for eCommerce",
          "Support Bots for SaaS onboarding",
          "Lead qualification and nurturing"
        ],
        industriesServed: [
          "Technology",
          "Retail",
          "Financial Services",
          "Healthcare"
        ],
        faqs: [
          { question: `What does ${extractedName} do?`, answer: `${extractedName} provides AI-powered sales and support automation to help businesses increase revenue and customer satisfaction.` },
          { question: "How do I get started?", answer: "You can schedule a demo through our website or contact our sales team directly." },
          { question: "Can I talk to a real representative?", answer: "Yes, you can schedule a call with one of our sales representatives through our website." }
        ],
        contactInfo: {
          website: url,
          scheduleDemo: "#schedule-demo",
          email: email || "contact@company.com"
        },
        conversationStarters: [
          "Tell me about your AI solutions",
          "How can you help my business?",
          "What makes your service different?",
          "Can you share some success stories?",
          "What industries do you work with?"
        ]
      }
    };
  } else {
    const extractedName = name || extractNameFromUrl(url);
    
    // Individual JSON template
    return {
      individualProfile: {
        full_name: extractedName,
        bio: `Experienced sales professional with a passion for helping businesses leverage technology to achieve their goals. Specializes in understanding client needs and providing tailored solutions that deliver measurable results.`,
        profession_or_role: "Sales Professional",
        services_or_offers: "Consultative Sales, Solution Design, Business Development Strategy",
        target_audience: "Business owners and decision-makers looking for technology solutions",
        use_case: "Sales representation, business development, client relationship management",
        voice_tone: "Professional, Friendly, Knowledgeable", 
        agent_greeting: `Hello! I'm ${extractedName}'s AI assistant. How can I help you today?`,
        agent_intro: `I can help answer questions about ${extractedName}'s services and experience, and connect you with them if you're interested in working together.`,
        value_offer: `${extractedName} has a proven track record of helping clients increase their revenue by an average of 27% through strategic technology implementation.`,
        support_actions: "Schedule consultations, share case studies, answer questions about services and expertise",
        call_to_action: "Would you like to schedule a 30-minute consultation with me to discuss how I can help your business?"
      },
      // Keep original data structure for backward compatibility
      originalData: {
        name: extractedName,
        title: "Sales Professional",
        headline: "Helping businesses grow through innovative solutions",
        toneOfVoice: "Professional, Friendly, Knowledgeable",
        about: `Experienced sales professional with a passion for helping businesses leverage technology to achieve their goals. Specializes in understanding client needs and providing tailored solutions that deliver measurable results.`,
        coreSkills: [
          "Consultative Sales",
          "Relationship Building",
          "Solution Design",
          "Customer Success"
        ],
        servicesOffered: [
          "Sales Consulting",
          "Business Development Strategy"
        ],
        experienceHighlights: [
          { title: "Senior Sales Manager", company: "Tech Innovations Inc.", date: "2020 - Present" },
          { title: "Sales Representative", company: "Digital Solutions Co.", date: "2018 - 2020" }
        ],
        contact: {
          email: email || "contact@individual.com",
          calendly: "#schedule-meeting"
        },
        conversationStarters: [
          "What services do you offer?",
          "Tell me about your experience",
          "How do you help your clients?",
          "What makes your approach unique?",
          "Can we schedule a consultation?"
        ]
      }
    };
  }
}

function extractNameFromUrl(url: string): string {
  try {
    // Try to extract a name from LinkedIn URL
    if (url.includes('linkedin.com/company/')) {
      return url
        .split('linkedin.com/company/')[1]
        .split('/')[0]
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    if (url.includes('linkedin.com/in/')) {
      return url
        .split('linkedin.com/in/')[1]
        .split('/')[0]
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Try to extract domain name for company websites
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch (error) {
    console.error("Error extracting name from URL:", error);
    return "Unknown";
  }
}
