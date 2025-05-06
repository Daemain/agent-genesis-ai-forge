
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
    return {
      companyProfile: {
        name: name || extractNameFromUrl(url),
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
          { question: `What does ${name} do?`, answer: `${name} provides AI-powered sales and support automation to help businesses increase revenue and customer satisfaction.` },
          { question: "How do I get started?", answer: "You can schedule a demo through our website or contact our sales team directly." },
          { question: "Can I talk to a real representative?", answer: "Yes, you can schedule a call with one of our sales representatives through our website." }
        ],
        contactInfo: {
          website: url,
          scheduleDemo: "#schedule-demo",
          email: email || "contact@company.com"
        }
      }
    };
  } else {
    return {
      individualProfile: {
        name: name || extractNameFromUrl(url),
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
        }
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
