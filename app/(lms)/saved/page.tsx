import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function SavedPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center p-12">
            <Card className="max-w-md w-full">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Construction className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h1>
                    <p className="text-muted-foreground text-sm">
                        The Saved section is currently under development. Check back soon!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
