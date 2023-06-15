import { useState, useEffect } from "react";
import {
    redirect,
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    MetaObject,
    Movie,
    PersonInMovie,
    Person as PersonType,
} from "../types/movieType";
import PersonInMovieForm, {
    PeopleList,
    PersonInMovieFormType,
} from "../components/PersonInMovieForm";
import axios from "axios";
import LoadingCircle from "../components/LoadingCircle";
import dayjs from "dayjs";
import { Person } from "../types/movieType";

async function getPeopleToPick() {
    try {
        const result = await axios.get<(PersonType & { _id: string })[]>(
            "http://localhost:7777/api/person/all"
        );
        return result.data;
    } catch (error) {
        return false;
    }
}

type MovieToDB = Movie & {
    created_by: string;
    people: (PersonInMovie & { person_id: string })[];
};

type MovieFromDB = Movie & {
    people: (PersonInMovie & { person_id: Person & { _id: string } })[];
};

type MetadataInForm = {
    [reactKey: number]: {
        key: string;
        values: string[];
    };
};

const map = new WeakMap();
let index = 0;

function weakKey(obj: any) {
    let key = map.get(obj);
    if (!key) {
        key = "weak-key-" + index++;
        map.set(obj, key);
    }
    return key;
}

export default function MovieForm() {
    const createdBy = "648af4c41d8735e360cfd2af"; //TODO: Very temp

    const navigate = useNavigate();
    const { _id } = useParams();
    const [editedRole, setEditedRole] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [publishedAt, setPublishedAt] = useState("");
    const [genres, setGenres] = useState<string[]>([]);
    const [metadata, setMetadata] = useState<MetadataInForm>({});
    const [people, setPeople] = useState<PersonInMovieFormType[]>([]);

    const [peopleToPick, setPeopleToPick] = useState<
        PeopleList | false | undefined
    >(undefined);
    let uniqueKey = 0;

    useEffect(() => {
        getPeopleToPick().then(setPeopleToPick);

        if (_id) {
            getMovie(_id);
        }
    }, [_id]);

    const roleSuggestions = people.reduce((roles: string[], person) => {
        if (
            person.role !== "" &&
            person.role !== editedRole &&
            roles.indexOf(person.role) === -1
        ) {
            roles.push(person.role);
        }
        return roles;
    }, []);

    const peopleDetailSuggestions = ["Character"];

    function deletePersonCallback(person: PersonInMovieFormType) {
        setPeople((prevPeople) => {
            return prevPeople.filter(
                (prevPerson) => prevPerson.react_key !== person.react_key
            );
        });
    }

    function editPersonCallback(person: PersonInMovieFormType) {
        setPeople((prevPeople) => {
            const index = prevPeople.findIndex(
                (prevPerson) => prevPerson.react_key === person.react_key
            );
            prevPeople[index] = person;

            return [...prevPeople];
        });
    }

    function setEditedRoleCallback(role: string) {
        setEditedRole(role);
    }

    function getUniqueKey() {
        uniqueKey++;

        console.log(uniqueKey);
        return uniqueKey;
    }

    async function getMovie(_id: string) {
        try {
            const result = await axios.get(
                `http://localhost:7777/api/movie/${_id}`
            );
            const loadedMovie: MovieFromDB = result.data.data;

            setTitle(loadedMovie.title);
            setDescription(loadedMovie.description);
            setPublishedAt(
                dayjs(loadedMovie.published_at).format("YYYY-MM-DD")
            );
            setGenres(loadedMovie.genres);
            setMetadata(
                Object.entries(loadedMovie.metadata).reduce<MetadataInForm>(
                    (acc, [key, values]) => {
                        acc[getUniqueKey()] = { key, values };
                        return acc;
                    },
                    {}
                )
            );
            setPeople(
                loadedMovie.people.map<PersonInMovieFormType>((p) => {
                    const newPerson: PersonInMovieFormType = {
                        ...p,
                        person_id: p.person_id._id,
                        react_key: getUniqueKey(),
                        formDetails: {},
                    };
                    if (p.details) {
                        newPerson.formDetails = Object.entries(
                            p.details
                        ).reduce((acc, [key, values]) => {
                            return {
                                ...acc,
                                [getUniqueKey()]: {
                                    key,
                                    values,
                                },
                            };
                        }, {});
                    }
                    return newPerson;
                })
            );
        } catch (error) {
            console.error(error);
        }
    }

    async function submitForm() {
        const movie: MovieToDB = {
            created_by: createdBy,
            _id,
            title,
            dev: true,
            description,
            published_at: new Date(publishedAt),
            genres,
            metadata: Object.entries(metadata).reduce<MetaObject>(
                (acc, [, data]) => ({ ...acc, [data.key]: data.values }),
                {}
            ),
            people: people.map((p) => {
                p.details = Object.entries(p.formDetails).reduce<MetaObject>(
                    (acc, [, data]) => ({ ...acc, [data.key]: data.values }),
                    {}
                );
                return p;
            }),
        };

        console.log(movie);

        try {
            if (_id) {
                //Update
                await axios.put(
                    `http://localhost:7777/api/movie/${_id}`,
                    movie
                );
            } else {
                //Create
                await axios.post(
                    "http://localhost:7777/api/movie/create",
                    movie
                );
            }

            navigate("/movie/all");
        } catch (error: any) {
            if (error.response?.data?.errors) {
                console.error("Validation failed:", error.response.data.errors);
            } else {
                console.error("Undefined error", error);
            }
        }
    }

    return (
        <form
            style={{ display: "grid", justifyContent: "start" }}
            onSubmit={(e) => {
                e.preventDefault();
                submitForm();
            }}
        >
            {_id && <input type="hidden" name="_id" value={_id} />}
            <label htmlFor="title">Title: </label>
            <input
                type="title"
                name="title"
                id="title"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                }}
            />
            <label htmlFor="description">Description: </label>
            <textarea
                name="description"
                id="description"
                value={description}
                onChange={(e) => {
                    setDescription(e.target.value);
                }}
            />
            <label htmlFor="published_at">Published at: </label>
            <input
                type="date"
                name="published_at"
                id="published_at"
                value={publishedAt}
                onChange={(e) => {
                    setPublishedAt(e.target.value);
                }}
            />
            <label htmlFor="genres">Genres (space seperated):</label>
            <input
                type="input"
                name="genres"
                id="genres"
                value={genres.join(" ")}
                onChange={(e) => {
                    console.log(genres);
                    setGenres(e.target.value.split(" "));
                }}
            />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <h3>People</h3>
                {peopleToPick && (
                    <button
                        type="button"
                        onClick={() => {
                            setPeople((prevPeople) => {
                                return [
                                    ...prevPeople,
                                    {
                                        react_key: getUniqueKey(),
                                        role: "",
                                        person_id: "",
                                        formDetails: {},
                                    },
                                ];
                            });
                        }}
                    >
                        +
                    </button>
                )}
            </div>

            <div
                style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}
            >
                {peopleToPick === false && <span>Couldn't load people</span>}
                {peopleToPick === undefined && <LoadingCircle size="15px" />}
                {peopleToPick &&
                    (peopleToPick.length === 0 ? (
                        <span>No people in database, create some first</span>
                    ) : (
                        people.map((p, index) => (
                            <PersonInMovieForm
                                key={p.react_key}
                                person={p}
                                peopleToPick={peopleToPick}
                                index={index}
                                editPersonCallback={editPersonCallback}
                                deletePersonCallback={deletePersonCallback}
                                setEditedRoleCallback={setEditedRoleCallback}
                                getUniqueKey={getUniqueKey}
                            />
                        ))
                    ))}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <h3>Metadata</h3>
                <button
                    type="button"
                    onClick={() => {
                        setMetadata((prev) => {
                            return {
                                ...prev,
                                [getUniqueKey()]: {
                                    key: "",
                                    values: [],
                                },
                            };
                        });
                    }}
                >
                    +
                </button>
            </div>
            <div>
                {metadata &&
                    Object.entries(metadata).map(
                        ([reactKey, metadata], index) => (
                            <div key={reactKey}>
                                <input
                                    type="text"
                                    name={`metakey${index}`}
                                    value={metadata.key}
                                    onChange={(e) => {
                                        setMetadata((prev) => {
                                            return {
                                                ...prev,
                                                [reactKey]: {
                                                    key: e.target.value,
                                                    values: metadata.values,
                                                },
                                            };
                                        });
                                    }}
                                />
                                <input
                                    type="text"
                                    name={`metavalue${index}`}
                                    value={metadata.values.join(" ")}
                                    onChange={(e) => {
                                        setMetadata((prev) => {
                                            return {
                                                ...prev,
                                                [reactKey]: {
                                                    key: metadata.key,
                                                    values: e.target.value.split(
                                                        " "
                                                    ),
                                                },
                                            };
                                        });
                                    }}
                                />
                            </div>
                        )
                    )}
            </div>
            <datalist id="people-roles">
                {roleSuggestions.map((r) => (
                    <option key={r} value={r}>
                        {r}
                    </option>
                ))}
            </datalist>
            <datalist id="people-details">
                {peopleDetailSuggestions.map((r) => (
                    <option key={r} value={r}>
                        {r}
                    </option>
                ))}
            </datalist>
            <button type="submit">{_id ? "Update" : "Add"}</button>
        </form>
    );
}
