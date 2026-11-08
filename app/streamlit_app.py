"""Search interface (placeholder).  Run:  streamlit run app/streamlit_app.py

Planned: query box, method switch (Boolean / TF-IDF / BM25 / Embedding / Hybrid),
filters (technology, complexity, min stars), result cards with description, tech tags,
stars/forks, 'why it matched' and a link to the repository, plus related repositories.
"""

import streamlit as st

st.set_page_config(page_title="Open Source Project Discovery", page_icon="🔎")
st.title("Open Source Project Discovery Engine")
st.caption("Find GitHub repositories by what you want to build.")

query = st.text_input("What do you want to build?",
                      placeholder="beginner-friendly inventory management system using NestJS and PostgreSQL")
method = st.radio("Method", ["Boolean", "TF-IDF", "BM25", "Embedding", "Hybrid"], index=2, horizontal=True)

if query:
    st.info("Search is not implemented yet.")
