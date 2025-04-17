document.addEventListener('DOMContentLoaded', function() {
    // Data structure for the knowledge tree
    const treeData = {
        name: '神"智"妙液 : AI融合的神经体液调节的AI智慧课堂',
        children: [
            {
                name: '体温调节',
                children: [
                    { name: '炎热状态下的体温调节' },
                    { name: '寒冷状态下的体温调节' },
                    {
                        name: '神经体液器官',
                        children: [
                            { name: '下丘脑' },
                            { name: '垂体' },
                            { name: '甲状腺' },
                            { name: '外周温度感受器' }
                        ]
                    }
                ]
            },
            {
                name: '水盐调节',
                children: [
                    { name: '主动补水' },
                    { name: '肾小管重吸收' }
                    
                ]
            }
        ]
    };

    // Define video nodes and their sequence
    const videoNodeSequence = ['炎热状态下的体温调节', '寒冷状态下的体温调节', '主动补水', '肾小管重吸收'];
    
    // Get watched videos from localStorage
    const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '{}');
    
    // Function to check if a node should be active based on watched videos
    function shouldNodeBeActive(nodeName) {
        // Root node is always active
        if (nodeName === treeData.name) return true;
        
        // If node is not in video sequence, check its parent's status
        if (!videoNodeSequence.includes(nodeName)) {
            // Non-video nodes inherit the active state of the last watched video
            const currentIndex = findLastWatchedVideoIndex();
            if (currentIndex === -1) {
                // If no videos watched, only root is active
                return false;
            }
            
            // If the node comes after the last watched node in the tree traversal,
            // we need to check if it's in a branch that should be unlocked
            // This is a simplified approach - a more complex traversal might be needed
            return isNodeUnlockedInTraversal(nodeName);
        }
        
        // For video nodes, current node is active if either:
        // 1. It's the first video node
        // 2. The previous video in sequence has been watched
        const nodeIndex = videoNodeSequence.indexOf(nodeName);
        if (nodeIndex === 0) return true;
        
        const prevVideoNode = videoNodeSequence[nodeIndex - 1];
        return watchedVideos[prevVideoNode] === true;
    }
    
    // Function to find the index of the last watched video
    function findLastWatchedVideoIndex() {
        for (let i = videoNodeSequence.length - 1; i >= 0; i--) {
            if (watchedVideos[videoNodeSequence[i]]) {
                return i;
            }
        }
        return -1; // No videos watched
    }
    
    // Function to check if a node is unlocked in traversal order
    function isNodeUnlockedInTraversal(nodeName) {
        // Find the last watched video index
        const lastWatchedIndex = findLastWatchedVideoIndex();
        if (lastWatchedIndex === -1) return false;
        
        // Get the last watched video name
        const lastWatchedVideo = videoNodeSequence[lastWatchedIndex];
        
        // For this simplified implementation, we'll check if any parent nodes in the path
        // have the same or earlier position in the sequence as the last watched video
        
        // This would need a more complex implementation for a real tree traversal
        // For now, we'll use a simplified approach where we unlock all non-video nodes
        // that appear after nodes that have been watched
        return true;
    }

    // SVG dimensions
    const width = 900;
    const height = 650;
    const margin = { top: 40, right: 10, bottom: 40, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Get the SVG element
    const svg = d3.select('#knowledge-tree')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Set background
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 14)
        .attr('fill', 'var(--tree-background)');

    // Create a gradient for the root node
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'root-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
    
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'var(--tree-root-gradient-start)');
    
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'var(--tree-root-gradient-end)');

    // Create a group for the visualization
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create a cluster layout
    const cluster = d3.cluster()
        .size([innerWidth, innerHeight])
        .separation((a, b) => {
            // Increase separation between nodes at the same depth
            return (a.parent == b.parent ? 2 : 1.5);
        });

    // Create the hierarchy from the data
    const root = d3.hierarchy(treeData);
    
    // Apply the cluster layout to the hierarchy
    cluster(root);

    // Draw links with animation
    const links = g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y))
        .style('opacity', 0)
        .style('stroke-dasharray', function() {
            return this.getTotalLength() + ' ' + this.getTotalLength();
        })
        .style('stroke-dashoffset', function() {
            return this.getTotalLength();
        });

    // Animate links
    links.transition()
        .duration(1000)
        .delay((d, i) => i * 50)
        .style('opacity', 1)
        .style('stroke-dashoffset', 0);

    // Create node groups with animation
    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', d => {
            // Define video nodes
            const videoNodes = videoNodeSequence;
            let classes = `node ${d.depth === 0 ? 'root' : ''}`;
            
            // Add video-node class for video nodes
            if (videoNodes.includes(d.data.name)) {
                classes += ' video-node';
            }
            
            // Add active/inactive class based on watched videos
            if (shouldNodeBeActive(d.data.name)) {
                classes += ' active';
            } else {
                classes += ' inactive';
            }
            
            // Add watched class for watched videos
            if (watchedVideos[d.data.name]) {
                classes += ' watched';
            }
            
            return classes;
        })
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .style('opacity', 0)
        .on('click', function(event, d) {
            // Only allow clicking on active nodes
            if (!d3.select(this).classed('active') && !d3.select(this).classed('root')) {
                // Create tooltip showing node is locked
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', '#ff6b6b')
                    .style('padding', '10px')
                    .style('border-radius', '8px')
                    .style('box-shadow', 'var(--shadow)')
                    .style('color', 'white')
                    .style('opacity', 0)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .html(`<strong>${d.data.name}</strong><br>请先观看前面的视频内容`);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                setTimeout(() => {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0)
                        .remove();
                }, 2000);
                
                return;
            }
            
            // Map specific node names to video URLs
            const videoMap = {
                '炎热状态下的体温调节': 'video-player.html?video=炎热状态下的体温调节.mp4',
                '寒冷状态下的体温调节': 'video-player.html?video=寒冷状态下的体温调节.mp4',
                '主动补水': 'video-player.html?video=主动补水.mp4',
                '肾小管重吸收': 'video-player.html?video=肾小管重吸收.mp4'
            };
            
            // If node name exists in videoMap, navigate to the video page
            if (videoMap[d.data.name]) {
                window.location.href = videoMap[d.data.name];
                return;
            }
            
            // Create tooltip with node info for nodes without videos
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('padding', '10px')
                .style('border-radius', '8px')
                .style('box-shadow', 'var(--shadow)')
                .style('opacity', 0)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .html(`<strong>${d.data.name}</strong>`);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            setTimeout(() => {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0)
                    .remove();
            }, 2000);
        });

    // Animate nodes
    nodes.transition()
        .duration(1000)
        .delay((d, i) => 500 + i * 50)
        .style('opacity', 1);

    // Define video nodes for visual indicators
    const videoNodes = videoNodeSequence;

    // Draw nodes
    nodes.each(function(d) {
        const node = d3.select(this);
        const isVideoNode = videoNodes.includes(d.data.name);
        const isActive = shouldNodeBeActive(d.data.name);
        const isWatched = watchedVideos[d.data.name];
        
        if (d.depth === 0) {
            // Root node as rounded rectangle with gradient
            const padding = 40;
            const textElement = node.append('text')
                .attr('dy', '.33em')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', 'var(--tree-background)')
                .text(d => d.data.name);
            
            // Calculate width based on text
            const textWidth = textElement.node().getComputedTextLength() + padding;
            const height = 40;
            
            // Create background rectangle
            node.insert('rect', 'text')
                .attr('width', textWidth)
                .attr('height', height)
                .attr('x', -textWidth / 2)
                .attr('y', -height / 2)
                .attr('rx', 12)
                .attr('ry', 12)
                .attr('fill', 'url(#root-gradient)');
            
            // Center text
            textElement.attr('dx', 0);
        } else {
            // Other nodes as circles with video indicator if applicable
            node.append('circle')
                .attr('r', d.children ? 14 : 12)
                .attr('fill', function() {
                    if (!isActive) return '#cccccc'; // Inactive nodes
                    if (isWatched) return '#4caf50'; // Watched video nodes
                    if (isVideoNode) return 'var(--accent-color)'; // Unwatched video nodes
                    return 'var(--tree-node-fill)'; // Regular nodes
                })
                .attr('stroke', d.children ? 'var(--tree-node-stroke)' : 'var(--tree-leaf-stroke)')
                .attr('stroke-width', 2)
                .style('opacity', isActive ? 1 : 0.6);
            
            // Add play icon for video nodes
            if (isVideoNode) {
                // Add play triangle
                node.append('polygon')
                    .attr('points', '4,-6 4,6 12,0')
                    .attr('fill', 'white')
                    .attr('transform', 'translate(-4, 0)')
                    .style('opacity', isActive ? 1 : 0.6);
            }
            
            // Add lock icon for inactive nodes
            if (!isActive) {
                node.append('text')
                    .attr('dy', '4')
                    .attr('font-size', '14px')
                    .attr('fill', '#666')
                    .style('text-anchor', 'middle')
                    .html('&#128274;'); // Lock emoji
            }
            
            // Add text for node name
            const textElement = node.append('text')
                .attr('dy', d.children ? -20 : 25)
                .attr('font-size', '10px')
                .attr('fill', isActive ? 'var(--text-primary)' : '#999')
                .style('text-anchor', 'middle')
                .text(d => d.data.name.length > 15 ? d.data.name.substr(0, 15) + '...' : d.data.name);
            
            // Create background for text
            const textWidth = textElement.node().getComputedTextLength() + 10;
            
            node.insert('rect', 'text')
                .attr('width', textWidth)
                .attr('height', 20)
                .attr('x', -textWidth / 2)
                .attr('y', d.children ? -35 : 15)
                .attr('rx', 4)
                .attr('ry', 4)
                .attr('fill', 'white')
                .attr('fill-opacity', isActive ? 0.8 : 0.5);
                
            // Add video indicator to text for video nodes
            if (isVideoNode) {
                textElement.style('font-weight', 'bold');
                const statusText = isWatched ? '已观看' : '点击播放视频';
                node.append('text')
                    .attr('dy', d.children ? -35 : 45)
                    .attr('font-size', '8px')
                    .attr('fill', isWatched ? '#4caf50' : 'var(--accent-color)')
                    .style('text-anchor', 'middle')
                    .style('font-weight', 'bold')
                    .style('opacity', isActive ? 1 : 0.6)
                    .text(statusText);
            }
        }
    });
    
    // Add zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
}); 