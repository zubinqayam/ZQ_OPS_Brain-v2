import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, FolderOpen, Brain, Settings, 
  Send, Map, RefreshCw, ChevronRight, Database,
  Cpu, Layers, Zap, FileText, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import './App.css'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface WoodsStatus {
  mapped: boolean
  message: string
  chunk_count?: number
  source_folder?: string
}

// Matrix visualization component
const MatrixVisualization = () => (
  <div className="relative w-48 h-48 mx-auto">
    {/* Front Matrix - Top */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-lg flex items-center justify-center animate-pulse">
      <div className="text-center">
        <Cpu className="w-6 h-6 text-rose-400 mx-auto mb-1" />
        <span className="text-xs text-rose-300">FRONT</span>
      </div>
    </div>
    
    {/* Back Matrix - Bottom Left */}
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Database className="w-6 h-6 text-blue-400 mx-auto mb-1" />
        <span className="text-xs text-blue-300">BACK</span>
      </div>
    </div>
    
    {/* Up Matrix - Bottom Right */}
    <div className="absolute bottom-0 right-0 w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Layers className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
        <span className="text-xs text-emerald-300">UP</span>
      </div>
    </div>
    
    {/* Connection lines */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
      <line x1="50%" y1="20%" x2="25%" y2="80%" stroke="#3f3f46" strokeWidth="2" />
      <line x1="50%" y1="20%" x2="75%" y2="80%" stroke="#3f3f46" strokeWidth="2" />
      <line x1="25%" y1="80%" x2="75%" y2="80%" stroke="#3f3f46" strokeWidth="2" />
    </svg>
  </div>
)

// Status bar component
const StatusBar = ({ woodsStatus }: { woodsStatus: WoodsStatus | null }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-rose-400" />
        <span className="text-rose-400 font-medium">INNM ACTIVE</span>
      </div>
      {woodsStatus?.mapped && (
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Database className="w-3 h-3" />
          <span>WOODS: {woodsStatus.chunk_count} chunks</span>
        </div>
      )}
    </div>
    <div className="flex items-center gap-4 text-zinc-500">
      <span>Triangular Matrix Engine v1.0</span>
    </div>
  </div>
)

// Main App
function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: 'INNM Intelligence System initialized. The Triangular Matrix Engine is ready. Map a WOODS folder to begin document retrieval.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [woodsStatus, setWoodsStatus] = useState<WoodsStatus | null>(null)
  const [folderPath, setFolderPath] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check WOODS status on mount
  useEffect(() => {
    checkWoodsStatus()
  }, [])

  const checkWoodsStatus = async () => {
    try {
      // In a real implementation, this would call the Tauri backend
      // const status = await invoke('get_woods_status')
      // setWoodsStatus(status)
      
      // For now, simulate no WOODS mapped
      setWoodsStatus({
        mapped: false,
        message: 'No WOODS folder mapped. Please map a folder first.'
      })
    } catch (e) {
      toast.error('Failed to check WOODS status')
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsProcessing(true)

    try {
      // In a real implementation, this would call the Tauri backend
      // const response = await invoke('send_message', { message: input })
      
      // Simulate processing delay
      await new Promise(r => setTimeout(r, 1500))
      
      // Simulate response based on input
      let responseText = ''
      const lowerInput = input.toLowerCase()
      
      if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        responseText = 'Greetings. I am INNM, the Intelligence Box. How may I assist you with your WOODS data?'
      } else if (lowerInput.includes('woods') || lowerInput.includes('map')) {
        responseText = 'To map a WOODS folder, navigate to the WOODS tab and select a folder containing text files (.txt, .md, .csv, .log).'
      } else if (lowerInput.includes('matrix') || lowerInput.includes('triangular')) {
        responseText = 'The Triangular Matrix consists of three components: FRONT (input processing), BACK (context validation), and UP (response synthesis).'
      } else if (!woodsStatus?.mapped) {
        responseText = 'I cannot search the WOODS yet. Please map a folder first using the WOODS tab. Once mapped, I can retrieve information from your documents.'
      } else {
        responseText = `Based on the connected folder, here is what I found regarding: ${input}\n\n- Document analysis shows relevant content in your mapped WOODS.\n- The Triangular Matrix has processed your query through all three matrices.\n\n(Source: WOODS Grid B)`
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      toast.error('Failed to get response from INNM')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMapWoods = async () => {
    if (!folderPath.trim()) {
      toast.error('Please enter a folder path')
      return
    }

    try {
      // In a real implementation, this would call the Tauri backend
      // await invoke('map_woods_folder', { folderPath })
      
      toast.success('Mapping WOODS folder...')
      await new Promise(r => setTimeout(r, 2000))
      
      setWoodsStatus({
        mapped: true,
        message: 'WOODS mapped successfully',
        chunk_count: 42,
        source_folder: folderPath
      })
      
      toast.success('WOODS folder mapped successfully!')
    } catch (e) {
      toast.error('Failed to map WOODS folder')
    }
  }

  const handleSelectFolder = async () => {
    try {
      // In a real implementation, this would call the Tauri backend
      // const selected = await invoke('select_folder')
      // if (selected) setFolderPath(selected)
      
      // For demo, use a placeholder
      setFolderPath('/home/user/documents')
      toast.info('Folder selection dialog would open here')
    } catch (e) {
      toast.error('Failed to select folder')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <StatusBar woodsStatus={woodsStatus} />
      
      {/* Header */}
      <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-100">INNM-WOSDS</h1>
            <p className="text-xs text-zinc-500">Intelligence System</p>
          </div>
        </div>
        <MatrixVisualization />
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-900/30 px-2 py-2 h-auto">
            <TabsTrigger value="chat" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="woods" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <FolderOpen className="w-4 h-4 mr-1.5" />
              WOODS
            </TabsTrigger>
            <TabsTrigger value="matrix" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Layers className="w-4 h-4 mr-1.5" />
              Matrix
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-300">
              <Settings className="w-4 h-4 mr-1.5" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            {/* Chat Tab */}
            <TabsContent value="chat" className="h-full m-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-rose-600 text-white'
                            : msg.role === 'system'
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : 'bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs opacity-50 mt-1 block">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-200" />
                          <span className="text-sm text-zinc-400 ml-2">Triangular Matrix processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask INNM about your WOODS data..."
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isProcessing || !input.trim()}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                {!woodsStatus?.mapped && (
                  <p className="text-center text-xs text-amber-400 mt-2">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    No WOODS folder mapped. Go to the WOODS tab to map a folder.
                  </p>
                )}
              </div>
            </TabsContent>
            
            {/* WOODS Tab */}
            <TabsContent value="woods" className="h-full m-0 p-4 overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
                      <Map className="w-5 h-5 text-emerald-400" />
                      WOODS Folder Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Map a folder containing text documents (.txt, .md, .csv, .log) to enable INNM document retrieval.
                    </p>
                    
                    <div className="flex gap-2">
                      <Input
                        value={folderPath}
                        onChange={(e) => setFolderPath(e.target.value)}
                        placeholder="/path/to/documents"
                        className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200"
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleSelectFolder}
                        className="border-zinc-700"
                      >
                        Browse
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={handleMapWoods}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Map WOODS Folder
                    </Button>
                  </CardContent>
                </Card>
                
                {woodsStatus?.mapped && (
                  <Card className="bg-zinc-900/50 border-emerald-500/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        WOODS Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Status</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400">Mapped</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Source</span>
                        <span className="text-zinc-200">{woodsStatus.source_folder}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Chunks</span>
                        <span className="text-zinc-200">{woodsStatus.chunk_count}</span>
                      </div>
                      <Separator className="bg-zinc-800 my-2" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={checkWoodsStatus}
                        className="w-full border-zinc-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Status
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">Supported File Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {['.txt', '.md', '.csv', '.log'].map(ext => (
                        <Badge key={ext} variant="outline" className="border-zinc-700">
                          <FileText className="w-3 h-3 mr-1" />
                          {ext}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Matrix Tab */}
            <TabsContent value="matrix" className="h-full m-0 p-4 overflow-auto">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-200 mb-2">Triangular Matrix Engine</h2>
                  <p className="text-zinc-400">Three matrices working in harmony for intelligent document retrieval</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Front Matrix */}
                  <Card className="bg-zinc-900/50 border-rose-500/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-rose-400 flex items-center gap-2">
                        <Cpu className="w-5 h-5" />
                        FRONT Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-zinc-400">Input Processing & Intent Detection</p>
                      <ul className="text-xs text-zinc-500 space-y-1">
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Keyword extraction
                        </li>
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Intent classification
                        </li>
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Query vectorization
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Back Matrix */}
                  <Card className="bg-zinc-900/50 border-blue-500/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        BACK Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-zinc-400">Context Validation & History</p>
                      <ul className="text-xs text-zinc-500 space-y-1">
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Conversation history
                        </li>
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Constraint checking
                        </li>
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Scope validation
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Up Matrix */}
                  <Card className="bg-zinc-900/50 border-emerald-500/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        UP Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-zinc-400">Response Synthesis</p>
                      <ul className="text-xs text-zinc-500 space-y-1">
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          WOODS data retrieval
                        </li>
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Relevance scoring
                        </li>
                        <li className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Answer synthesis
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">Processing Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-2">
                          <span className="text-rose-400 font-bold">1</span>
                        </div>
                        <span className="text-zinc-400">Input</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-600" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-2">
                          <Cpu className="w-6 h-6 text-rose-400" />
                        </div>
                        <span className="text-zinc-400">FRONT</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-600" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mb-2">
                          <Database className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-zinc-400">BACK</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-600" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-2">
                          <Layers className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-zinc-400">UP</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-600" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-2">
                          <span className="text-emerald-400 font-bold">OUT</span>
                        </div>
                        <span className="text-zinc-400">Response</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="h-full m-0 p-4 overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Version</span>
                      <span className="text-zinc-200">1.0.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Engine</span>
                      <span className="text-zinc-200">Triangular Matrix</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Mode</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Offline</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">Data Storage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">WOODS Store</span>
                      <span className="text-zinc-200 font-mono text-xs">~/.local/share/innm-wosds/WOODS_STORE</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Active Mapcore</span>
                      <span className="text-zinc-200 font-mono text-xs">.../memory/active_mapcore.json</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

export default App
