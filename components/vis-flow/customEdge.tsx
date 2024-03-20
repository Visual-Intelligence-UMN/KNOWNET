import React, { FC } from 'react';
import { Typography, Popover, PopoverHandler, PopoverContent} from '@material-tailwind/react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const CustomEdge: FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    data,
    label,
}) => {

    // const [showTooltip, setShowTooltip] = React.useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });



    const links = Object.keys(data.papers).map((key) => {
        const urls = data['papers'][key]
        return <span key={key}>
            <span className='font-bold'>{key.toLocaleLowerCase()} </span> in {urls.length} papers :
                {urls.slice(0, 3).map(
                    (url) => <a key={url} href={`https://pubmed.ncbi.nlm.nih.gov/${url}`} target='_blank'> 
                        <i className="fas fa-solid fa-arrow-up-right-from-square px-1"/> 
                    </a>
                )}
                {urls.length > 3 && '...' }
            
            <br />
        </span>
    })

    const tooltipContent = <div className="w-80">
        <Typography color="blue-gray" className="font-medium">
            {data.targetName} -&gt; {data.sourceName}
        </Typography>
        <Typography
        variant="small"
        color="blue-gray"
        className="font-normal opacity-80"
        >
            {links}
        </Typography>
    </div>

    const num_papers = Object.values(data.papers).reduce((acc:number, val) => acc + val.length, 0)

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style}/>
            <EdgeLabelRenderer >

                {/* <Tooltip content={tooltipContent} className="border border-blue-gray-50 bg-white px-4 py-3 shadow-xl shadow-black/10" 
                // open={showTooltip}
                >
                <div
                    style={{
                        ...style,
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        backgroundColor: 'white',
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                    // onClick={() => setShowTooltip(!showTooltip)}
                >
                    {label!.toString().toLowerCase()}
                </div>
                </Tooltip> */}

                {/* Popover seems to perform better */}
                <Popover>
                    <PopoverHandler>
                        <div
                            style={{
                                ...style,
                                position: 'absolute',
                                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(0.8)`,
                                backgroundColor: 'white',
                                pointerEvents: 'all',
                                cursor: 'pointer'
                            }}
                            className="nodrag nopan"
                        >
                            {label!.toString().toLowerCase()}{` `}
                            <span className='border-l border-gray-400 px-[2px] text-gray-600 text-sm'><i className="fas fa-regular fa-circle-check px-1" />{num_papers}</span>
                        </div>
                    </PopoverHandler>
                    <PopoverContent>
                        {tooltipContent}
                    </PopoverContent>
                </Popover>

            </EdgeLabelRenderer>
        </>
    );
};

export default CustomEdge;
