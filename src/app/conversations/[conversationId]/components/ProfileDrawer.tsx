"use client";

import { FC, Fragment, useMemo, useState } from "react";
import { Conversation, User } from "@prisma/client";
import { format } from "date-fns";
import { Dialog, Transition } from "@headlessui/react";
import { IoClose, IoTrash } from "react-icons/io5";

import useOtherUser from "@/app/hooks/useOtherUser";
import Avatar from "@/app/components/Avatar";
import ConfirmModal from "./ConfirmModal";
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: Conversation & {
        users: User[];
    };
}

const ProfileDrawer: FC<ProfileDrawerProps> = ({ isOpen, onClose, data }) => {
    const otherUser = useOtherUser(data);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const { members } = useActiveList();
    const isActive = members.indexOf(otherUser?.email!) !== -1;

    const joinDate = useMemo(() => {
        if (otherUser?.createdAt) {
            return format(new Date(otherUser.createdAt), "PP");
        }
    }, [otherUser?.createdAt]);

    const title = useMemo(() => {
        return data.name ?? otherUser?.name;
    }, [data.name, otherUser?.name]);

    const statusText = useMemo(() => {
        if (data.isGroup) {
            return `${data.users.length} members`;
        }

        return isActive ? "Active" : "Offline";
    }, [data, isActive]);

    return (
        <>
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
            />
            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease=out duration-500"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-500"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-40" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                                <Transition.Child
                                    as={Fragment}
                                    enter="transform transition ease-in-out duration-500"
                                    enterFrom="translate-x-full"
                                    enterTo="translate-x-0"
                                    leave="transform transition ease-in-out duration-500"
                                    leaveTo="translate-x-full"
                                >
                                    <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                        <div className="flex h-full flex-col overflow-y-scroll bg-skin-main py-6 shadow-xl">
                                            <div className="px-4 sm:px-6">
                                                <div className="flex items-start justify-end">
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            onClick={onClose}
                                                            type="button"
                                                            className="rounded-xl bg-skin-main text-skin-additional hover:text-skin-additional-hover focus:outline-none focus:ring-2 focus:ring-skin-main focus:ring-offset-2"
                                                        >
                                                            <span className="sr-only">Close panel</span>
                                                            <IoClose size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative mt-6 flex-1 px-4 sm:px-6 ">
                                                <div className="flex flex-col items-center">
                                                    <div className="mb-2">
                                                        {data.isGroup ? (
                                                            <AvatarGroup users={data.users} />
                                                        ) : (
                                                            <Avatar user={otherUser!} />
                                                        )}
                                                    </div>
                                                    <div>{title}</div>
                                                    <div className="text-sm text-skin-additional">
                                                        {statusText}
                                                    </div>
                                                    <div className="flex gap-10 my-8">
                                                        <div
                                                            onClick={() => setConfirmOpen(true)}
                                                            className="flex flex-col fap-3 items-center cursor-pointer hover:opacity-75"
                                                        >
                                                            <div
                                                                className="w-10 h-10 
                                                                text-skin-base
                                                                bg-skin-additional rounded-full flex items-center justify-center"
                                                            >
                                                                <IoTrash size={20} />
                                                            </div>
                                                            <div className="mt-2 text-sm font-light text-skin-additional">
                                                                Delete
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full pb-5 pt-5 sm:px-0 sm:pt-0">
                                                        <dl className="space-y-8 px-4 sm:space-y-6 sm:px-6">
                                                            {data.isGroup && (
                                                                <div>
                                                                    <dt className="text-sm font-medium text-skin-additional sm:w-40 sm:flex-shrink-0">
                                                                        Emails
                                                                    </dt>
                                                                    <dd className="mt-1 text-sm text-skin-base sm:col-span-2">
                                                                        {data.users
                                                                            .map((user) => user.email)
                                                                            .join(", ")}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                            {!data.isGroup && (
                                                                <div>
                                                                    <dt className="text-sm font-medium text-skin-additional sm:w-40 sm:flex-shrink-0">
                                                                        Email
                                                                    </dt>
                                                                    <dd className="mt-1 text-sm text-skin-base sm:col-span-2">
                                                                        {otherUser?.email}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                            {!data.isGroup && (
                                                                <>
                                                                    <hr />
                                                                    <div>
                                                                        <dt className="text-sm font-medium text-skin-additional sm:w-40 sm:flex-shrink-0">
                                                                            Joined
                                                                        </dt>
                                                                        <dd className="mt-1 text-sm text-skin-base sm:col-span-2">
                                                                            <time dateTime={joinDate}>
                                                                                {joinDate}
                                                                            </time>
                                                                        </dd>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

export default ProfileDrawer;
