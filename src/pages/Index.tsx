import ChatInterface from "@/components/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">InsureAssist</h1>
              <p className="text-sm text-muted-foreground">Smart Insurance Intake & Recommendations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">Chat-Only Mode</div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="py-8">
        <ChatInterface />
      </main>
    </div>
  );
};

export default Index;
