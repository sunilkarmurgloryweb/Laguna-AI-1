@@ .. @@
 export interface SendMessageRequest {
   message: string;
-  currentFormData?: Record<string, any>;
+  currentFormData?: Record<string, unknown>;
   context?: string;
 }