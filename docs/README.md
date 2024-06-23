# KNOWNET

<!-- ## [LINK TO DEMO](https://www.umn-visual-intelligence-lab.com/) -->

KNOWNET is a visualization system that enhances health information retrieval by integrating Large Language Models (LLMs) with Knowledge Graphs (KGs). In the era of information overload, finding accurate and relevant health information can be challenging, especially when it involves complex topics like Alzheimer's disease and dietary supplements. Traditional LLMs, while powerful, often generate responses that lack factual accuracy, structured exploration, and clear representation of intricate information structures.

To address these challenges, KNOWNET leverages the structured representation of knowledge graphs to provide enhanced accuracy and structured exploration. It extracts triples (e.g., entities and their relations) from LLM outputs and maps them into the validated information and supported evidence in external KGs. For structured exploration, KNOWNET provides next-step recommendations based on the neighborhood of the currently explored entities in KGs, aiming to guide a comprehensive understanding without overlooking critical aspects.

In contrast to traditional LLM question-answering, which often generates lengthy and unverified text, KNOWNET provides:

- Validation through literature for accuracy, ensuring that the information is supported by scientific research.
- Next-step recommendations for comprehensive exploration, guiding users to a deeper understanding of the topic.
- Step-by-step graph visualization for a progressive understanding of the topic, allowing users to track their exploration journey.

<figure>
    <img src="./assets/teaser.png" width=800>
    <figcaption> <b>In contrast to traditional LLM question-answering (left), which often generate lengthy and unverified text, KNOWNET (right)
leverages external knowledge graph (KG) to enhance health information seeking with LLM. </b> KNOWNET provides (1) validation through
literature for accuracy, (2) next-step recommendations for comprehensive exploration, and (3) step-by-step graph visualization  for a progressive understanding of the topic. </figcaption>
</figure>
