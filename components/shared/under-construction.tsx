export default function UnderConstruction() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            {/* Floating icons */}
            <div className="relative w-32 h-32">
                <i className="ti ti-crane text-5xl text-blue-300 absolute top-0 left-1/2 -translate-x-1/2 animate-bounce" />
                <i className="ti ti-hammer text-3xl text-foreground absolute bottom-2 left-2 animate-pulse" />
                <i className="ti ti-tool text-3xl text-muted-foreground absolute bottom-2 right-2 animate-pulse" style={{ animationDelay: "0.3s" }} />
                <i className="ti ti-helmet text-2xl text-warning-400 absolute top-10 left-0 animate-bounce" style={{ animationDelay: "0.2s" }} />
                <i className="ti ti-cone text-2xl text-warning-500 absolute top-10 right-0 animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>

            <div className="text-center space-y-2 pt-2">
                <h2 className="text-title-sm font-semibold text-foreground">Under Construction</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                    This feature is still being built. Check back soon!
                </p>
            </div>

            {/* Progress bar animation */}
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
            </div>
        </div>
    );
}
