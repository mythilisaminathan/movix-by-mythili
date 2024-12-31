import { useEffect, useState } from "react";
import "./styles.scss";
import { useParams } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";
import Spinner from "../../components/spinner/Spinner";
import Container from "../../components/container/Container";
import MovieCard from "../../components/movieCard/MovieCard";
import InfiniteScroll from "react-infinite-scroll-component";
import noResults from "../../assets/no-results.png";
import genAI from "../../utils/openai";

const SearchResults = () => {
	const [data, setData] = useState(null);
	const [page, setPage] = useState(1);
	const [geminiData, setGeminiData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
	const { query } = useParams();

	const getAISuggestions = async (query) => {
		try {
			setAiSuggestionLoading(true);
			setGeminiData([]);

			const prompt =
				"Act as a Movie Recommendation system and suggest some movies for the query : " +
				query +
				". only give me names of 5 movies, comma seperated like the example result given ahead. Example Result: Gadar, Sholay, Don, Golmaal, Koi Mil Gaya";

			const model = genAI.getGenerativeModel({ model: "gemini-pro" });
			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			const movieNames = text ? text.split(", ") : [];
			const promiseArr = movieNames.map((item) => fetchSingleMovie(item));

			const geminiMoviesData = await Promise.all(promiseArr);
			setGeminiData(geminiMoviesData);
		} catch (error) {
			console.log("Error in getAISuggestions", error.message);
		} finally {
			setAiSuggestionLoading(false);
		}
	};

	const fetchSingleMovie = async (item) => {
		const res = await fetchDataFromApi(
			`/search/movie?query=${item}&include_adult=false&language=en-US&page=1`
		);
		return res.results[0];
	};

	const fetchInitialData = () => {
		setLoading(true);
		fetchDataFromApi(`/search/multi?query=${query}&page=${page}`).then(
			(res) => {
				setData(res);
				setPage((prev) => prev + 1);
				setLoading(false);
			}
		);
	};

	const fetchNextPageData = () => {
		fetchDataFromApi(`/search/multi?query=${query}&page=${page}`).then(
			(res) => {
				if (data?.results) {
					setData({ ...data, results: [...data?.results, ...res.results] });
				} else {
					setData(res);
				}

				setPage((prev) => prev + 1);
			}
		);
	};

	useEffect(() => {
		getAISuggestions(query);
		setPage(1);
		fetchInitialData();
	}, [query]);

	console.log(geminiData, data?.results);
	return (
		<div className="searchResultsPage">
			{(aiSuggestionLoading || loading) && <Spinner initial />}

			{!aiSuggestionLoading && !loading && (
				<Container>
					{data?.results.length !== 0 || geminiData?.length !== 0 ? (
						<>
							{geminiData?.length > 0 && (
								<>
									<div className="pageTitle">
										{`Ai recommendations for '${query}'`}
									</div>
									<div className="content ai-box">
										{geminiData.map(
											(movie, idx) =>
												movie && (
													<MovieCard
														key={idx}
														data={movie}
														fromSearch
														mediaType={movie.media_type}
													/>
												)
										)}
									</div>
								</>
							)}
							{data?.results.length > 0 && (
								<>
									<div className="pageTitle">
										{`Search ${
											data.total_results > 1 ? "results" : "result"
										} of '${query}'`}
									</div>

									<InfiniteScroll
										className="content"
										loader={<Spinner />}
										next={fetchNextPageData}
										dataLength={data?.results?.length || []}
										hasMore={page <= data?.total_pages}
									>
										{data?.results.map((item, idx) => {
											if (item.media_type === "person") return;

											return (
												<MovieCard
													key={idx}
													data={item}
													fromSearch
													mediaType={item.media_type}
												/>
											);
										})}
									</InfiniteScroll>
								</>
							)}
						</>
					) : (
						<div className="noResultContainer">
							<img src={noResults} alt="" />
							<span className="resultNotFound">No Results Found</span>
						</div>
					)}
				</Container>
			)}
		</div>
	);
};

export default SearchResults;
