import { useState, useEffect, useRef, useCallback } from "react";
import { User, LogOut, Save, UserCircle, AlertCircle, CheckCircle2, Camera, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FINANCE_INTERESTS, INDIAN_STATES } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { processImage, uploadAvatar, deleteAvatar } from "@/lib/avatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProfilePage = () => {
  const { user, logout, updateProfile, markOnboardingComplete, updateUserAvatar } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    region: "",
    interests: [] as string[],
    hobbies: "",
    profession: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [completedFields, setCompletedFields] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data from database on mount (includes onboarding data)
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProfile(true);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, onboarding_completed, age, region, interests, profession, hobbies, description, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // Fall back to auth user data
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            age: user.age?.toString() || "",
            region: user.region || "",
            interests: user.interests || [],
            hobbies: user.hobbies || "",
            profession: user.profession || "",
            description: user.description || "",
          });
          setIsProfileComplete(false);
        } else if (profile) {
          // Use database data (includes onboarding fields)
          setFormData({
            firstName: profile.first_name || user.firstName || "",
            lastName: profile.last_name || user.lastName || "",
            age: profile.age?.toString() || "",
            region: profile.region || "",
            interests: profile.interests || [],
            hobbies: profile.hobbies || "",
            profession: profile.profession || "",
            description: profile.description || "",
          });
          
          // Set avatar preview if available
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
          
          // Check completion status
          const hasAllFields = profile.age && profile.region && profile.interests?.length > 0 && 
                               profile.profession && profile.hobbies && profile.description;
          setIsProfileComplete(hasAllFields || profile.onboarding_completed || false);
          
          // Update AuthContext if profile is complete (removes navbar badge)
          if (hasAllFields || profile.onboarding_completed) {
            markOnboardingComplete();
          }
          
          // Count completed fields
          let count = 0;
          if (profile.age) count++;
          if (profile.region) count++;
          if (profile.interests && profile.interests.length > 0) count++;
          if (profile.profession) count++;
          if (profile.hobbies) count++;
          if (profile.description) count++;
          setCompletedFields(count);
        } else {
          // No profile row exists
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            age: "",
            region: "",
            interests: [],
            hobbies: "",
            profession: "",
            description: "",
          });
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setIsProfileComplete(false);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user, markOnboardingComplete]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    if (!updateProfile) {
      toast({
        title: "Error",
        description: "Profile update is not available",
        variant: "destructive",
      });
      return;
    }

    // Validate age
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 99) {
        toast({
          title: "Invalid Age",
          description: "Please enter a valid age between 1 and 99",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Update auth metadata
      const result = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? parseInt(formData.age) : undefined,
        region: formData.region,
        interests: formData.interests,
        hobbies: formData.hobbies,
        profession: formData.profession,
        description: formData.description,
      });

      // Also update profiles table in database
      if (result.success && user) {
        const { error: dbError } = await supabase
          .from("profiles")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            age: formData.age ? parseInt(formData.age) : null,
            region: formData.region || null,
            interests: formData.interests.length > 0 ? formData.interests : null,
            hobbies: formData.hobbies || null,
            profession: formData.profession || null,
            description: formData.description || null,
            onboarding_completed: true,
          })
          .eq("id", user.id);

        if (dbError) {
          console.error("Error updating database profile:", dbError);
        } else {
          // Recalculate completion status
          let count = 0;
          if (formData.age) count++;
          if (formData.region) count++;
          if (formData.interests.length > 0) count++;
          if (formData.profession) count++;
          if (formData.hobbies) count++;
          if (formData.description) count++;
          setCompletedFields(count);
          
          // Only mark as complete if ALL 6 fields are filled
          const hasAllFields = count === 6;
          setIsProfileComplete(hasAllFields);
          
          // Only update AuthContext (remove navbar badge) if all fields complete
          if (hasAllFields) {
            markOnboardingComplete();
          }
        }
      }

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Start logout to show signing out overlay
      await logout();
      // Navigate immediately — the spinner remains visible during
      // the full page reload transition
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message || "Unable to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    const first = formData.firstName?.[0] || "";
    const last = formData.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getCompletionPercentage = () => {
    return Math.round((completedFields / 6) * 100);
  };

  // Avatar handling functions
  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    
    const result = await processImage(file);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setIsUploadingAvatar(false);
      return;
    }

    // Show preview with blob URL immediately
    setAvatarPreview(result.url);

    // Upload to Supabase
    const uploadResult = await uploadAvatar(user.id, result.blob);
    
    if (uploadResult.error) {
      toast({
        title: "Upload Failed",
        description: uploadResult.error,
        variant: "destructive",
      });
      setAvatarPreview(user.avatarUrl || null);
    } else {
      // Use permanent Supabase URL and update AuthContext
      if (uploadResult.url) {
        setAvatarPreview(uploadResult.url);
        updateUserAvatar(uploadResult.url);
      }
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    }
    
    setIsUploadingAvatar(false);
  }, [user, toast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    setIsUploadingAvatar(true);
    
    const result = await deleteAvatar(user.id);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setAvatarPreview(null);
      updateUserAvatar(null);
      toast({
        title: "Success",
        description: "Profile picture removed",
      });
    }
    
    setIsUploadingAvatar(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-8 px-4">
        {/* Profile Completion Banner */}
        {!isLoadingProfile && !isProfileComplete && (
          <Alert className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">
              Complete Your Profile
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <p className="mt-1">
                You've filled {completedFields} of 6 profile fields ({getCompletionPercentage()}%). 
                Complete your profile below to get personalized content recommendations.
              </p>
              <div className="mt-3 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Complete Success Banner */}
        {!isLoadingProfile && isProfileComplete && completedFields >= 3 && (
          <Alert className="mb-6 border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Profile Complete!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Thank you for completing your profile. You'll now receive personalized content recommendations.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="text-center">
            {/* Avatar Upload Section */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar 
                  className={`h-24 w-24 bg-primary cursor-pointer transition-all duration-200 ${
                    isDragging ? "ring-4 ring-primary ring-offset-2" : ""
                  } ${isUploadingAvatar ? "opacity-70" : ""}`}
                  onClick={!avatarPreview ? triggerFileInput : undefined}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Profile" 
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="text-3xl font-semibold text-primary-foreground bg-primary">
                      {getInitials()}
                    </AvatarFallback>
                  )}
                  
                  {/* Upload overlay */}
                  {!avatarPreview && !isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  )}
                  
                  {/* Loading spinner */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </Avatar>
                
                {/* Remove button (only shown when avatar exists) */}
                {avatarPreview && !isUploadingAvatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    title="Remove profile picture"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                
                {/* Camera button (shown when avatar exists) */}
                {avatarPreview && !isUploadingAvatar && (
                  <button
                    onClick={triggerFileInput}
                    className="absolute -bottom-1 -right-1 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
                    title="Change profile picture"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {/* Upload hint */}
            {!avatarPreview && (
              <p className="text-sm text-muted-foreground mb-2">
                Click or drag & drop an image (max 5MB)
              </p>
            )}
            
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription>
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="Enter your age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">State/UT</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleInputChange("region", value)}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Professional Information
              </h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => handleInputChange("profession", e.target.value)}
                  placeholder="Enter your profession"
                />
              </div>

              <div className="space-y-2">
                <Label>Finance Interests</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {FINANCE_INTERESTS.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleInterestToggle(interest)}
                      />
                      <Label
                        htmlFor={interest}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobbies">Hobbies</Label>
                <Input
                  id="hobbies"
                  value={formData.hobbies}
                  onChange={(e) => handleInputChange("hobbies", e.target.value)}
                  placeholder="Enter your hobbies"
                />
              </div>
            </div>

            {/* About You */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">About You</h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={4}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Action Buttons */}
            <Separator />
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full sm:w-auto gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
