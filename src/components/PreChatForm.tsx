import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const preChatSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  phone: z.string().optional(),
  company: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

type PreChatFormData = z.infer<typeof preChatSchema>;

interface PreChatFormProps {
  welcomeMessage?: string;
  requiredFields?: string[];
  primaryColor?: string;
  onSubmit: (data: PreChatFormData) => Promise<void>;
}

export const PreChatForm = ({ 
  welcomeMessage = "Please tell us a bit about yourself before we start the conversation.",
  requiredFields = ["name", "email"],
  primaryColor = "#000000",
  onSubmit 
}: PreChatFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<PreChatFormData>({
    resolver: zodResolver(preChatSchema),
  });

  const isFieldRequired = (field: string) => requiredFields.includes(field);

  const handleFormSubmit = async (data: PreChatFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Pre-chat form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Welcome!</CardTitle>
        <CardDescription className="text-sm">
          {welcomeMessage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">
              Name {isFieldRequired("name") && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Your full name"
              className="h-9"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">
              Email {isFieldRequired("email") && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="your.email@example.com"
              className="h-9"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {isFieldRequired("phone") && (
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">
                Phone {isFieldRequired("phone") && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+1 (555) 000-0000"
                className="h-9"
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          )}

          {isFieldRequired("company") && (
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-sm">
                Company {isFieldRequired("company") && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Your company name"
                className="h-9"
              />
              {errors.company && (
                <p className="text-xs text-destructive">{errors.company.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-sm">
              How can we help you?
            </Label>
            <Textarea
              id="message"
              {...register("message")}
              placeholder="Brief description of your inquiry..."
              rows={3}
              className="resize-none text-sm"
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            style={{ backgroundColor: primaryColor }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting chat..." : "Start Chat"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};