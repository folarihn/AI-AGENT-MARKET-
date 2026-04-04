import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Play, Search, Code, FileText, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
            Safe, Verified AI Agents for your Workflow
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl mx-auto">
            Discover, buy, and install standardized AI agents. All agents are manually reviewed and security scanned for your safety.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
                Browse Agents
              </Button>
            </Link>
            <Link href="/dashboard/creator">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-indigo-600">
                Submit an Agent
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex justify-center items-center space-x-2 text-sm text-indigo-200">
            <ShieldCheck className="h-5 w-5" />
            <span>100% Malware Scanned & Verified</span>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Explore Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Developer Tools</h3>
              <p className="text-gray-600 mb-4">
                Code review bots, documentation generators, and test architects.
              </p>
              <Link href="/marketplace?category=dev-tools" className="text-indigo-600 font-medium hover:underline">
                Browse Dev Tools &rarr;
              </Link>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Content Creation</h3>
              <p className="text-gray-600 mb-4">
                SEO writers, social media repurposing, and ad copy generators.
              </p>
              <Link href="/marketplace?category=content" className="text-indigo-600 font-medium hover:underline">
                Browse Content &rarr;
              </Link>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Data & Research</h3>
              <p className="text-gray-600 mb-4">
                Competitor monitoring, financial summarizers, and lead enrichment.
              </p>
              <Link href="/marketplace?category=data" className="text-indigo-600 font-medium hover:underline">
                Browse Data &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How it Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Search className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">1. Discover</h3>
              <p className="mt-2 text-gray-600">
                Find the perfect agent for your task. Read reviews and verify permissions.
              </p>
            </div>
            <div>
              <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Download className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">2. Download</h3>
              <p className="mt-2 text-gray-600">
                Get the standardized agent package. Secure and signed.
              </p>
            </div>
            <div>
              <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Play className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">3. Run Locally</h3>
              <p className="mt-2 text-gray-600">
                Install and run on your machine. You keep control of your data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
