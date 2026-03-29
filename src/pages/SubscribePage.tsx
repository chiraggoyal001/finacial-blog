import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";

const SubscribePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center">
        <SubscribeSection variant="full" />
      </div>
      <Footer />
    </div>
  );
};

export default SubscribePage;
