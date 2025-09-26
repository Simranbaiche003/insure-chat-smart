import { useState, useRef, useEffect } from "react";
import { ChatMessage, IntakeState, ViewMode } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Send, User, Bot } from "lucide-react";
import { toPricingProfile } from "@/lib/profile";
import Recommendations from "./Recommendations";

const INITIAL_STATE: IntakeState = {
  identity: { source: null },
  contact: null,
  health: {
    conditions: [],
    surgeries: [],
    family_history: [],
  },
  family_members: [],
  policy: {},
  consents: {},
  audit: [],
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Welcome to your insurance intake! I'll help you find the perfect plan by collecting some basic information. Let's start with your identity verification. Would you like to upload your Aadhaar for quick prefill?",
      timestamp: new Date(),
      chips: ["Upload Aadhaar", "Enter manually"],
    }
  ]);
  const [input, setInput] = useState("");
  const [intakeState, setIntakeState] = useState<IntakeState>(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState<"kyc" | "personal" | "health" | "family" | "policy" | "consents" | "recommendations">("kyc");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const addMessage = (content: string, type: "user" | "assistant" = "assistant", chips?: string[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      chips,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const updateIntakeState = (updates: Partial<IntakeState>) => {
    setIntakeState(prev => ({ ...prev, ...updates }));
  };

  const handleChipClick = async (chip: string) => {
    addMessage(chip, "user");
    await handleUserInput(chip);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    addMessage(userMessage, "user");
    await handleUserInput(userMessage);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addMessage(`Uploaded ${file.name}`, "user");
    
    // Simulate Aadhaar parsing
    setTimeout(() => {
      const mockAadhaarData = {
        name: "Rajesh Kumar",
        dob: "1990-05-15",
        gender: "M" as const,
        address: "123 MG Road, Bangalore, Karnataka 560001",
        aadhaar_last4: "1234",
        aadhaar_ref_id: "REF" + Math.random().toString(36).substr(2, 8).toUpperCase(),
      };

      updateIntakeState({
        identity: {
          source: "aadhaar_offline_xml",
          ...mockAadhaarData,
        }
      });

      addMessage(
        `Great! I've verified your Aadhaar and filled your basics:\n• Name: ${mockAadhaarData.name}\n• DOB: ${mockAadhaarData.dob}\n• Gender: ${mockAadhaarData.gender}\n• Aadhaar: ****-****-${mockAadhaarData.aadhaar_last4}\n\nShall I continue with your contact details?`,
        "assistant",
        ["Yes, continue", "Edit details"]
      );
      setCurrentStep("personal");
    }, 2000);
  };

  const handleUserInput = async (input: string) => {
    const lowerInput = input.toLowerCase();

    switch (currentStep) {
      case "kyc":
        if (lowerInput.includes("upload") || lowerInput.includes("aadhaar")) {
          fileInputRef.current?.click();
          addMessage("Please select your Aadhaar file (PDF, JPG, or PNG):", "assistant");
        } else if (lowerInput.includes("manual")) {
          addMessage("Let's collect your details manually. What's your full name?", "assistant");
          setCurrentStep("personal");
        } else if (lowerInput.includes("continue") || lowerInput.includes("yes")) {
          proceedToPersonal();
        }
        break;

      case "personal":
        if (!intakeState.contact?.mobile) {
          const phoneRegex = /\d{10}/;
          if (phoneRegex.test(input)) {
            updateIntakeState({
              contact: { ...intakeState.contact, mobile: input }
            });
            addMessage("Got it! What's your email address?", "assistant");
          } else {
            addMessage("What's your mobile number (10 digits)?", "assistant");
          }
        } else if (!intakeState.contact?.email) {
          const emailRegex = /\S+@\S+\.\S+/;
          if (emailRegex.test(input)) {
            updateIntakeState({
              contact: { ...intakeState.contact, email: input }
            });
            proceedToHealth();
          } else {
            addMessage("Please provide a valid email address:", "assistant");
          }
        } else {
          proceedToHealth();
        }
        break;

      case "health":
        await handleHealthInput(input);
        break;

      case "family":
        await handleFamilyInput(input);
        break;

      case "policy":
        await handlePolicyInput(input);
        break;

      case "consents":
        await handleConsentsInput(input);
        break;
    }
  };

  const proceedToPersonal = () => {
    if (!intakeState.contact?.mobile) {
      addMessage("Perfect! Now let's get your contact details. What's your mobile number?", "assistant");
    } else {
      proceedToHealth();
    }
  };

  const proceedToHealth = () => {
    setCurrentStep("health");
    if (!intakeState.health?.height_cm) {
      addMessage("Now for some health details. What's your height in centimeters?", "assistant");
    }
  };

  const handleHealthInput = async (input: string) => {
    const lowerInput = input.toLowerCase();

    if (!intakeState.health?.height_cm) {
      const height = parseInt(input);
      if (height > 100 && height < 250) {
        updateIntakeState({
          health: { ...intakeState.health, height_cm: height }
        });
        addMessage("Great! What's your weight in kilograms?", "assistant");
      } else {
        addMessage("Please enter a valid height in centimeters (e.g., 175):", "assistant");
      }
    } else if (!intakeState.health?.weight_kg) {
      const weight = parseInt(input);
      if (weight > 30 && weight < 200) {
        const bmi = weight / Math.pow((intakeState.health.height_cm! / 100), 2);
        updateIntakeState({
          health: { 
            ...intakeState.health, 
            weight_kg: weight,
            bmi: Math.round(bmi * 10) / 10
          }
        });
        addMessage(`Perfect! Your BMI is ${Math.round(bmi * 10) / 10}. Now, what's your smoking status?`, "assistant", [
          "Never smoked", "Occasional smoker", "Daily smoker"
        ]);
      } else {
        addMessage("Please enter a valid weight in kilograms (e.g., 70):", "assistant");
      }
    } else if (!intakeState.health?.smoker) {
      let smokerStatus: "never" | "occasional" | "daily" = "never";
      if (lowerInput.includes("never")) smokerStatus = "never";
      else if (lowerInput.includes("occasional")) smokerStatus = "occasional";
      else if (lowerInput.includes("daily")) smokerStatus = "daily";

      updateIntakeState({
        health: { ...intakeState.health, smoker: smokerStatus }
      });
      addMessage("How often do you drink alcohol?", "assistant", [
        "None", "Occasional", "Regular"
      ]);
    } else if (!intakeState.health?.alcohol) {
      let alcoholStatus: "none" | "occasional" | "regular" = "none";
      if (lowerInput.includes("none")) alcoholStatus = "none";
      else if (lowerInput.includes("occasional")) alcoholStatus = "occasional";
      else if (lowerInput.includes("regular")) alcoholStatus = "regular";

      updateIntakeState({
        health: { ...intakeState.health, alcohol: alcoholStatus }
      });
      addMessage("Do you have any diagnosed medical conditions?", "assistant", [
        "Diabetes", "Hypertension", "Asthma", "None", "Other"
      ]);
    } else if (intakeState.health.conditions.length === 0 && lowerInput !== "none") {
      if (lowerInput.includes("none")) {
        proceedToFamily();
      } else {
        const condition = lowerInput.includes("diabetes") ? "diabetes" : 
                         lowerInput.includes("hypertension") ? "hypertension" :
                         lowerInput.includes("asthma") ? "asthma" : input;
        
        updateIntakeState({
          health: {
            ...intakeState.health,
            conditions: [{ name: condition, diagnosed_on: new Date().toISOString().split('T')[0] }]
          }
        });
        addMessage("Thank you for sharing that information. Any other conditions?", "assistant", [
          "No, that's all", "Add another condition"
        ]);
      }
    } else {
      if (lowerInput.includes("no") || lowerInput.includes("all")) {
        proceedToFamily();
      }
    }
  };

  const proceedToFamily = () => {
    setCurrentStep("family");
    addMessage("Great! Now, what type of policy are you looking for?", "assistant", [
      "Individual Health", "Family Floater", "Life Insurance"
    ]);
  };

  const handleFamilyInput = async (input: string) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("individual")) {
      updateIntakeState({
        policy: { ...intakeState.policy, type: "health" }
      });
      proceedToPolicy();
    } else if (lowerInput.includes("family")) {
      updateIntakeState({
        policy: { ...intakeState.policy, type: "family_floater" }
      });
      addMessage("Perfect! How many family members do you want to include?", "assistant", [
        "Spouse only", "Spouse + 1 child", "Spouse + 2 children", "Add parents too"
      ]);
    } else if (lowerInput.includes("life")) {
      updateIntakeState({
        policy: { ...intakeState.policy, type: "life" }
      });
      proceedToPolicy();
    } else if (lowerInput.includes("spouse")) {
      const familySize = lowerInput.includes("child") ? 
        (lowerInput.includes("2") ? 3 : 2) : 1;
      
      updateIntakeState({
        family_members: Array(familySize).fill(null).map((_, i) => ({
          relation: i === 0 ? "spouse" as const : "child" as const,
          name: "",
          conditions: [],
          medications: [],
          surgeries: []
        }))
      });
      proceedToPolicy();
    }
  };

  const proceedToPolicy = () => {
    setCurrentStep("policy");
    addMessage("What coverage amount are you looking for?", "assistant", [
      "₹5 Lakhs", "₹10 Lakhs", "₹20 Lakhs", "₹50 Lakhs", "Custom amount"
    ]);
  };

  const handlePolicyInput = async (input: string) => {
    const lowerInput = input.toLowerCase();

    if (!intakeState.policy?.sum_assured_inr) {
      let amount = 500000;
      if (lowerInput.includes("5")) amount = 500000;
      else if (lowerInput.includes("10")) amount = 1000000;
      else if (lowerInput.includes("20")) amount = 2000000;
      else if (lowerInput.includes("50")) amount = 5000000;
      else if (lowerInput.includes("custom")) {
        addMessage("Please enter your desired coverage amount in lakhs (e.g., 15 for ₹15 lakhs):", "assistant");
        return;
      } else {
        const customAmount = parseInt(input) * 100000;
        if (customAmount > 0) amount = customAmount;
      }

      updateIntakeState({
        policy: { ...intakeState.policy, sum_assured_inr: amount }
      });
      addMessage("How would you like to pay your premiums?", "assistant", [
        "Monthly", "Yearly (save 8%)"
      ]);
    } else if (!intakeState.policy?.premium_frequency) {
      const frequency = lowerInput.includes("monthly") ? "monthly" : "yearly";
      updateIntakeState({
        policy: { ...intakeState.policy, premium_frequency: frequency }
      });
      addMessage("Would you like to set up UPI AutoPay for additional 5% discount?", "assistant", [
        "Yes, setup AutoPay", "No, I'll pay manually"
      ]);
    } else if (!intakeState.policy?.autopay) {
      if (lowerInput.includes("yes") || lowerInput.includes("setup")) {
        addMessage("Great! Please enter your UPI ID (e.g., yourname@paytm):", "assistant");
      } else {
        proceedToConsents();
      }
    } else if (!intakeState.policy?.autopay?.vpa) {
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
      if (upiRegex.test(input)) {
        updateIntakeState({
          policy: {
            ...intakeState.policy,
            autopay: {
              mode: "upi",
              vpa: input,
              mandate_id: "MANDATE_" + Math.random().toString(36).substr(2, 8).toUpperCase()
            }
          }
        });
        proceedToConsents();
      } else {
        addMessage("Please enter a valid UPI ID (e.g., yourname@paytm):", "assistant");
      }
    }
  };

  const proceedToConsents = () => {
    setCurrentStep("consents");
    addMessage("Almost done! I need your consent for a few things:", "assistant", [
      "I agree to all consents", "Show me the details"
    ]);
  };

  const handleConsentsInput = async (input: string) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("agree")) {
      updateIntakeState({
        consents: {
          purpose_ack: true,
          ekyc_offline_ok: true,
          data_processing_ok: true,
          medical_tests_ok: true,
          declarations_ok: true,
          timestamp: new Date().toISOString()
        }
      });
      
      addMessage("Perfect! All set — ready to review your personalized recommendations!", "assistant");
      
      setTimeout(() => {
        setShowRecommendations(true);
        setCurrentStep("recommendations");
      }, 1000);
    } else {
      addMessage("Here are the consents needed:\n• Use your data for insurance quotes\n• Process your Aadhaar information securely\n• Share data with insurance partners\n• Conduct medical tests if needed\n• Your declarations are accurate\n\nDo you agree to proceed?", "assistant", [
        "Yes, I agree", "I need more details"
      ]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-4 mb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-2xl ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
                {message.type === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`${message.type === "user" ? "text-right" : "text-left"}`}>
                <Card className={`p-4 ${message.type === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.chips && message.chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.chips.map((chip, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => handleChipClick(chip)}
                          className="text-xs"
                        >
                          {chip}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
                <div className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showRecommendations && (
        <div className="mb-8">
          <Recommendations profile={toPricingProfile(intakeState)} />
        </div>
      )}

      {!showRecommendations && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="icon">
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}