import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'react-flow-renderer';
import { Download, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ArchitectureView = () => {
    const { repoId } = useParams();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const fetchArchitecture = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(`/ai/analyze/architecture?repo_id=${repoId}`);

            // Transform data for React Flow
            const flowNodes = response.data.modules.map((module, index) => ({
                id: module.id,
                type: 'default',
                data: { label: module.name },
                position: {
                    x: 250 * Math.cos(index * (Math.PI * 2) / response.data.modules.length),
                    y: 250 * Math.sin(index * (Math.PI * 2) / response.data.modules.length)
                },
                style: {
                    background: module.type === 'controller' ? '#3B82F6' :
                        module.type === 'service' ? '#10B981' :
                            module.type === 'model' ? '#8B5CF6' : '#6366F1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    width: 150,
                },
            }));

            const flowEdges = response.data.dependencies.map(dep => ({
                id: `${dep.from}-${dep.to}`,
                source: dep.from,
                target: dep.to,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#94A3B8' },
            }));

            setNodes(flowNodes);
            setEdges(flowEdges);
        } catch (error) {
            console.error('Failed to fetch architecture:', error);
        } finally {
            setLoading(false);
        }
    }, [repoId, setNodes, setEdges]);

    useEffect(() => {
        fetchArchitecture();
    }, [fetchArchitecture]);

    const handleDownload = () => {
        const data = { nodes, edges };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'architecture.json';
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen relative">
                <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center border border-white/10 z-10 shadow-glass-premium">
                    <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-300 font-medium tracking-wide">Generating architecture diagram...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen relative overflow-hidden font-sans">
            <div className="absolute top-6 right-6 z-10 flex space-x-3">
                <button
                    onClick={fetchArchitecture}
                    className="px-4 py-2.5 glass-panel text-white hover:bg-white/10 transition flex items-center space-x-2 border border-white/10 text-sm font-medium shadow-glass-premium"
                >
                    <RefreshCw className="w-4 h-4 text-neon-purple" />
                    <span>Refresh</span>
                </button>
                <button
                    onClick={handleDownload}
                    className="px-4 py-2.5 btn-primary text-white transition flex items-center space-x-2 text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                </button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background color="#4B5563" gap={16} />
                <Controls className="bg-dark-800 border-white/10 text-white shadow-xl rounded-lg overflow-hidden [&>button]:border-white/10 [&>button]:hover:bg-white/10" />
                <MiniMap
                    nodeColor={(node) => node.style?.background || '#6366F1'}
                    maskColor="rgba(0, 0, 0, 0.4)"
                    style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
            </ReactFlow>
        </div>
    );
};

export default ArchitectureView;