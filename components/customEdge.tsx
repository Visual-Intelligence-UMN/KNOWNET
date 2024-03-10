import React, { FC } from 'react';
import { Tooltip , Typography, Popover, PopoverHandler, PopoverContent} from '@material-tailwind/react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { IconExternalLink } from './ui/icons';

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
    label
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
            <span className='font-bold'>{key.toLocaleLowerCase()} </span>: {urls.length} papers 
            <a href={`https://pubmed.ncbi.nlm.nih.gov/${urls[0]}`} target='_blank'><IconExternalLink className="size-4 inline-block" /> </a>
            <br />
        </span>
    })

    const tooltipContent = <div className="w-80">
        <Typography color="blue-gray" className="font-medium">
            Evidences
        </Typography>
        <Typography
        variant="small"
        color="blue-gray"
        className="font-normal opacity-80"
        >
            {links}
        </Typography>
    </div>

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
                                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                                backgroundColor: 'white',
                                pointerEvents: 'all',
                            }}
                            className="nodrag nopan"
                        >
                            {label!.toString().toLowerCase()}
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
